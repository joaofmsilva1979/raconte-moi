import { useState, useEffect, useCallback } from 'react';
import { DayStats, getWeekStats } from '@/db/trendsRepository';

export type TrendsViewMode = 'week' | 'month';

export interface DayScore extends DayStats {
  score: number; // 0-10
}

export function computeDayScore(day: DayStats): number {
  let score = 0;

  // Sommeil : 1→0, 2→2, 3→4, pas de log→2 (neutre)
  if (day.sleepQuality === 3) score += 4;
  else if (day.sleepQuality === 2) score += 2;
  else if (day.sleepQuality === 1) score += 0;
  else score += 2;

  // Douleur : 0→3, 1→1, 2+→0
  if (day.painCount === 0) score += 3;
  else if (day.painCount === 1) score += 1;

  // Activité : ≥30min→2, ≥15min→1
  if (day.activityMinutes >= 30) score += 2;
  else if (day.activityMinutes >= 15) score += 1;

  // Ressenti positif : +1
  if (day.goodCount > 0) score += 1;

  // Médicament avec bon effet (efficacy=3) : +1
  if (day.medEfficacyGoodCount > 0) score += 1;

  // Accessoire aidant utilisé : +1
  if (day.aidCount > 0) score += 1;

  return Math.min(score, 10);
}

function getWeekRange(offsetWeeks: number): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today);
  to.setDate(today.getDate() - offsetWeeks * 7);
  const from = new Date(to);
  from.setDate(to.getDate() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getMonthRange(offsetMonths: number): { from: string; to: string } {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth() - offsetMonths, 1);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const cap = today.toISOString().slice(0, 10);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10) > cap ? cap : to.toISOString().slice(0, 10),
  };
}

export function useTrends() {
  const [viewMode, setViewMode] = useState<TrendsViewMode>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [days, setDays] = useState<DayScore[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = viewMode === 'week'
    ? getWeekRange(weekOffset)
    : getMonthRange(monthOffset);

  const isCurrentPeriod = viewMode === 'week' ? weekOffset === 0 : monthOffset === 0;

  const load = useCallback(async () => {
    setLoading(true);
    const stats = await getWeekStats(from, to);
    setDays(stats.map(d => ({ ...d, score: computeDayScore(d) })));
    setLoading(false);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const goBack = () => {
    if (viewMode === 'week') setWeekOffset(w => w + 1);
    else setMonthOffset(m => m + 1);
  };
  const goForward = () => {
    if (viewMode === 'week') setWeekOffset(w => Math.max(0, w - 1));
    else setMonthOffset(m => Math.max(0, m - 1));
  };

  const switchMode = (mode: TrendsViewMode) => {
    setViewMode(mode);
    setWeekOffset(0);
    setMonthOffset(0);
  };

  const daysWithData = days.filter(d =>
    d.sleepQuality !== null || d.painCount > 0 || d.fatigueCount > 0 ||
    d.goodCount > 0 || d.activityMinutes > 0 || d.medEfficacyGoodCount > 0 || d.aidCount > 0
  );
  const avgScore = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.score, 0) / daysWithData.length * 10) / 10
    : null;

  return { days, loading, from, to, goBack, goForward, isCurrentPeriod, avgScore, viewMode, switchMode };
}
