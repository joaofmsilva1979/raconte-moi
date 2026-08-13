import { getDatabase } from '@/db/database';

export interface DayStats {
  date: string;           // YYYY-MM-DD
  sleepQuality: number | null;
  painCount: number;
  fatigueCount: number;
  goodCount: number;
  activityMinutes: number;
  medEfficacyGoodCount: number;  // médicaments avec effet ressenti = 3
  aidCount: number;               // accessoires aidants utilisés
}

export async function getWeekStats(fromDate: string, toDate: string): Promise<DayStats[]> {
  const db = await getDatabase();

  const sleepRows = await db.getAllAsync<{ log_date: string; quality: number }>(
    `SELECT log_date, quality FROM sleep_logs WHERE log_date >= ? AND log_date <= ?`,
    [fromDate, toDate]
  );

  const ressentisRows = await db.getAllAsync<{ day: string; category: string; cnt: number }>(
    `SELECT date(recorded_at) as day, category, COUNT(*) as cnt
     FROM ressentis
     WHERE date(recorded_at) >= ? AND date(recorded_at) <= ?
     GROUP BY day, category`,
    [fromDate, toDate]
  );

  const activityRows = await db.getAllAsync<{ day: string; total: number }>(
    `SELECT date(recorded_at) as day, SUM(duration_minutes) as total
     FROM activities
     WHERE date(recorded_at) >= ? AND date(recorded_at) <= ?
     GROUP BY day`,
    [fromDate, toDate]
  );

  const medEfficacyRows = await db.getAllAsync<{ day: string; cnt: number }>(
    `SELECT date(recorded_at) as day, COUNT(*) as cnt
     FROM medication_logs
     WHERE date(recorded_at) >= ? AND date(recorded_at) <= ? AND efficacy = 3
     GROUP BY day`,
    [fromDate, toDate]
  );

  const aidRows = await db.getAllAsync<{ day: string; cnt: number }>(
    `SELECT date(recorded_at) as day, COUNT(*) as cnt
     FROM comfort_aid_logs
     WHERE date(recorded_at) >= ? AND date(recorded_at) <= ?
     GROUP BY day`,
    [fromDate, toDate]
  );

  const sleepMap: Record<string, number> = {};
  for (const r of sleepRows) sleepMap[r.log_date] = r.quality;

  const ressentisMap: Record<string, { pain: number; fatigue: number; good: number }> = {};
  for (const r of ressentisRows) {
    if (!ressentisMap[r.day]) ressentisMap[r.day] = { pain: 0, fatigue: 0, good: 0 };
    if (r.category === 'pain') ressentisMap[r.day].pain = r.cnt;
    if (r.category === 'fatigue') ressentisMap[r.day].fatigue = r.cnt;
    if (r.category === 'good') ressentisMap[r.day].good = r.cnt;
  }

  const activityMap: Record<string, number> = {};
  for (const r of activityRows) activityMap[r.day] = r.total;

  const medEfficacyMap: Record<string, number> = {};
  for (const r of medEfficacyRows) medEfficacyMap[r.day] = r.cnt;

  const aidMap: Record<string, number> = {};
  for (const r of aidRows) aidMap[r.day] = r.cnt;

  const days: DayStats[] = [];
  const from = new Date(fromDate);
  const to = new Date(toDate);
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const r = ressentisMap[key] ?? { pain: 0, fatigue: 0, good: 0 };
    days.push({
      date: key,
      sleepQuality: sleepMap[key] ?? null,
      painCount: r.pain,
      fatigueCount: r.fatigue,
      goodCount: r.good,
      activityMinutes: activityMap[key] ?? 0,
      medEfficacyGoodCount: medEfficacyMap[key] ?? 0,
      aidCount: aidMap[key] ?? 0,
    });
  }

  return days;
}
