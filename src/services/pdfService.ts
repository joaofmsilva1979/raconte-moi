import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Entry, Ressenti, MealType, Activity, SleepLog } from '@/types';
import { RESSENTI_LABELS, RESSENTI_ICONS, SUB_CATEGORY_LABELS } from '@/constants/ressentis';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';
import { ACTIVITY_LABELS, ACTIVITY_ICONS } from '@/constants/activities';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
  other: 'Autre',
};

const SLEEP_LABEL: Record<number, string> = { 1: 'Mal dormi 😣', 2: 'Sommeil moyen 😐', 3: 'Bien dormi 😊' };
const SLEEP_BG: Record<number, string> = { 1: '#FEE2E2', 2: '#FEF9C3', 3: '#DCFCE7' };
const SLEEP_COLOR: Record<number, string> = { 1: '#991B1B', 2: '#854D0E', 3: '#166534' };

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function entryHtml(entry: Entry, primaryColor: string, photoMap: Record<string, string>): string {
  const photoSrc = entry.photo_uri ? (photoMap[entry.photo_uri] ?? null) : null;
  const photoHtml = photoSrc
    ? `<img src="${photoSrc}" style="max-width:30%;height:auto;border-radius:6px;margin-top:8px;display:block;">`
    : '';
  return `
    <div class="entry" style="border-left-color:${primaryColor}">
      <div class="entry-header">
        <span class="entry-time">${fmt(entry.recorded_at)}</span>
        <span class="meal-label">${MEAL_LABELS[entry.meal_type]}</span>
      </div>
      <div class="transcript">${entry.transcript}</div>
      ${photoHtml}
    </div>`;
}

function ressentiHtml(r: Ressenti, standalone = false): string {
  const icon = RESSENTI_ICONS[r.category];
  const label = RESSENTI_LABELS[r.category];
  const subLabel = r.sub_category ? ` · ${SUB_CATEGORY_LABELS[r.sub_category] ?? r.sub_category}` : '';
  const delayLabel = r.delay_minutes != null
    ? ` · ~${r.delay_minutes < 60 ? r.delay_minutes + 'min' : Math.round(r.delay_minutes / 60) + 'h'} après`
    : '';
  const noteHtml = r.note ? `<span class="item-note"> — ${r.note}</span>` : '';
  const timeTag = standalone
    ? `<span class="feeling-time">💜 ${fmt(r.recorded_at)}</span>`
    : `<span class="item-time">${fmt(r.recorded_at)}</span>`;
  return `<div class="ressenti-item">${timeTag} ${icon} ${label}${subLabel}${delayLabel}${noteHtml}</div>`;
}

export function generateJournalHtml(
  entries: Entry[],
  ressentis: Ressenti[],
  firstName: string,
  periodLabel: string,
  primaryColor: string,
  activities: Activity[] = [],
  sleepLogs: SleepLog[] = [],
  photoMap: Record<string, string> = {},
): string {
  const days = new Set<string>();
  for (const e of entries) days.add(e.recorded_at.slice(0, 10));
  for (const r of ressentis) days.add(r.meal_date ?? r.recorded_at.slice(0, 10));
  for (const a of activities) days.add(a.recorded_at.slice(0, 10));
  for (const s of sleepLogs) days.add(s.log_date);

  const sortedDates = Array.from(days).sort();

  const groupedHtml = sortedDates.map((date) => {
    const dayEntries = entries.filter(e => e.recorded_at.slice(0, 10) === date);
    const dayRessentis = ressentis.filter(r => (r.meal_date ?? r.recorded_at.slice(0, 10)) === date);
    const dayActivities = activities.filter(a => a.recorded_at.slice(0, 10) === date);
    const sleepLog = sleepLogs.find(s => s.log_date === date) ?? null;

    const morningRessentis = dayRessentis.filter(r => r.context === 'morning');
    const freeRessentis = dayRessentis.filter(r => r.meal_type == null && r.context !== 'morning');

    // Sleep banner
    const sleepHtml = sleepLog ? `
      <div class="sleep-banner" style="background:${SLEEP_BG[sleepLog.quality]};color:${SLEEP_COLOR[sleepLog.quality]}">
        🌙 ${SLEEP_LABEL[sleepLog.quality]}
      </div>` : '';

    // Morning ressentis
    const morningHtml = morningRessentis.length > 0 ? `
      <div class="section morning-section">
        <div class="section-label">☀️ Au réveil</div>
        ${morningRessentis.map(r => ressentiHtml(r)).join('')}
      </div>` : '';

    // Unified timeline: meal slots + feeling ressentis interleaved by time
    type TLItem =
      | { kind: 'meal'; mealType: MealType; sortKey: number }
      | { kind: 'feeling'; ressenti: Ressenti; sortKey: number };

    const timelineItems: TLItem[] = [
      ...DEFAULT_MEAL_SLOTS.map(slot => ({
        kind: 'meal' as const,
        mealType: slot.meal_type as MealType,
        sortKey: slot.start_hour * 60,
      })),
      ...freeRessentis.map(r => {
        const d = new Date(r.recorded_at);
        return { kind: 'feeling' as const, ressenti: r, sortKey: d.getHours() * 60 + d.getMinutes() };
      }),
    ].sort((a, b) => a.sortKey - b.sortKey);

    const timelineHtml = timelineItems.map(item => {
      if (item.kind === 'feeling') {
        return `<div class="section feeling-section">${ressentiHtml(item.ressenti, true)}</div>`;
      }
      const slot = DEFAULT_MEAL_SLOTS.find(s => s.meal_type === item.mealType)!;
      const slotEntries = dayEntries.filter(e => e.meal_type === item.mealType);
      const slotRessentis = dayRessentis.filter(r => r.meal_type === item.mealType);
      if (slotEntries.length === 0 && slotRessentis.length === 0) return '';
      return `
        <div class="section meal-section">
          <div class="section-label">${slot.icon} ${slot.label}</div>
          ${slotEntries.map(e => entryHtml(e, primaryColor, photoMap)).join('')}
          ${slotRessentis.map(r => ressentiHtml(r)).join('')}
        </div>`;
    }).join('');

    // Activities
    const activitiesHtml = dayActivities.length > 0 ? `
      <div class="section activity-section">
        <div class="section-label">🏃 Activité physique</div>
        ${dayActivities.map(a => `
          <div class="activity-item">
            <span class="item-time">${fmt(a.recorded_at)}</span>
            ${ACTIVITY_ICONS[a.activity_type]} ${ACTIVITY_LABELS[a.activity_type]} · ${a.duration_minutes}min
            ${a.note ? `<span class="item-note"> — ${a.note}</span>` : ''}
          </div>`).join('')}
      </div>` : '';

    return `<h2>${formatDateLabel(date)}</h2>${sleepHtml}${morningHtml}${timelineHtml}${activitiesHtml}`;
  }).join('');

  const exportDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; color: #2D1A0E; font-size: 14px; }
    h1 { color: ${primaryColor}; font-size: 24px; margin-bottom: 4px; }
    h2 { color: ${primaryColor}; font-size: 15px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-top: 32px; text-transform: capitalize; }
    .sleep-banner { border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; font-weight: 700; font-size: 13px; }
    .section { margin-bottom: 12px; }
    .section-label { font-weight: 700; font-size: 11px; color: #5C3020; text-transform: uppercase; margin-bottom: 6px; }
    .morning-section .section-label { color: #8B5CF6; }
    .activity-section .section-label { color: #166534; }
    .entry { padding: 10px 12px; background: #FFF8F5; border-radius: 8px; border-left: 3px solid ${primaryColor}; margin-bottom: 6px; }
    .entry-header { display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; }
    .entry-time { font-weight: 700; font-size: 11px; color: #5C3020; }
    .meal-label { font-size: 10px; color: #C09070; text-transform: uppercase; }
    .transcript { font-size: 13px; line-height: 1.5; }
    .ressenti-item { font-size: 13px; color: #4C1D95; margin: 4px 0; padding: 6px 10px; background: #EDE9FE; border-radius: 6px; }
    .activity-item { font-size: 13px; color: #14532D; margin: 4px 0; padding: 6px 10px; background: #DCFCE7; border-radius: 6px; }
    .item-time { font-weight: 700; font-size: 11px; color: #6D28D9; margin-right: 4px; }
    .feeling-time { font-weight: 700; font-size: 11px; color: #6D28D9; margin-right: 4px; }
    .activity-item .item-time { color: #166534; }
    .item-note { font-style: italic; color: #6D28D9; }
    .activity-item .item-note { color: #16A34A; }
    .footer { margin-top: 48px; font-size: 11px; color: #C09070; text-align: center; border-top: 1px solid #F0D0B8; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>🥔 Les notes de patate</h1>
  <p style="color:#C09070; font-size:13px;">${firstName} — Bilan : ${periodLabel}</p>
  ${groupedHtml}
  <div class="footer">Généré le ${exportDate} — Les notes de patate (iOS) · Usage médical confidentiel</div>
</body>
</html>`;
}

async function buildPhotoMap(entries: Entry[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.photo_uri && !map[entry.photo_uri]) {
      try {
        const b64 = await FileSystem.readAsStringAsync(entry.photo_uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        map[entry.photo_uri] = `data:image/jpeg;base64,${b64}`;
      } catch {
        // photo inaccessible, skip silently
      }
    }
  }
  return map;
}

export async function exportJournalAsPdf(
  entries: Entry[],
  ressentis: Ressenti[],
  firstName: string,
  periodLabel: string,
  primaryColor: string,
  fromDate = '',
  toDate = '',
  activities: Activity[] = [],
  sleepLogs: SleepLog[] = [],
): Promise<void> {
  const photoMap = await buildPhotoMap(entries);
  const html = generateJournalHtml(entries, ressentis, firstName, periodLabel, primaryColor, activities, sleepLogs, photoMap);
  const { uri: tempUri } = await Print.printToFileAsync({ html });

  const safeName = firstName
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '')
    || 'Journal';
  const from = fromDate.replace(/-/g, '');
  const to = toDate.replace(/-/g, '');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `NOTES-PATATE_${safeName}_DU${from}_AU${to}_${today}.pdf`;

  const destUri = (FileSystem.documentDirectory ?? '') + filename;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
