import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Entry, Ressenti, MealType } from '@/types';
import { RESSENTI_LABELS, RESSENTI_ICONS, SUB_CATEGORY_LABELS } from '@/constants/ressentis';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
  other: 'Autre',
};

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function generateJournalHtml(
  entries: Entry[],
  ressentis: Ressenti[],
  firstName: string,
  periodLabel: string,
  primaryColor: string
): string {
  const grouped: Record<string, { entries: Entry[]; ressentis: Ressenti[] }> = {};

  for (const entry of entries) {
    const key = entry.recorded_at.slice(0, 10);
    if (!grouped[key]) grouped[key] = { entries: [], ressentis: [] };
    grouped[key].entries.push(entry);
  }

  for (const r of ressentis) {
    const key = r.meal_date ?? r.recorded_at.slice(0, 10);
    if (!grouped[key]) grouped[key] = { entries: [], ressentis: [] };
    grouped[key].ressentis.push(r);
  }

  const sortedDates = Object.keys(grouped).sort();

  const groupedHtml = sortedDates.map((date) => {
    const { entries: dayEntries, ressentis: dayRessentis } = grouped[date];

    const entriesHtml = dayEntries.map(entry => `
      <div class="entry">
        <div class="meal-label">${MEAL_LABELS[entry.meal_type]}</div>
        <div class="transcript">${entry.transcript}</div>
      </div>`).join('');

    const ressentisHtml = dayRessentis.length > 0 ? `
      <div class="ressentis-block">
        <div class="ressentis-title">Ressentis</div>
        ${dayRessentis.map(r => {
          const icon = RESSENTI_ICONS[r.category];
          const label = RESSENTI_LABELS[r.category];
          const subLabel = r.sub_category ? ` · ${SUB_CATEGORY_LABELS[r.sub_category] ?? r.sub_category}` : '';
          const noteHtml = r.note ? `<span class="ressenti-note"> — ${r.note}</span>` : '';
          return `<div class="ressenti-item">${icon} ${label}${subLabel}${noteHtml}</div>`;
        }).join('')}
      </div>` : '';

    return `<h2>${formatDateLabel(date)}</h2>${entriesHtml}${ressentisHtml}`;
  }).join('');

  const exportDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; color: #2D1A0E; }
    h1 { color: ${primaryColor}; font-size: 24px; margin-bottom: 4px; }
    h2 { color: ${primaryColor}; font-size: 15px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-top: 28px; text-transform: capitalize; }
    .entry { margin: 10px 0; padding: 10px 12px; background: #FFF8F5; border-radius: 8px; border-left: 3px solid ${primaryColor}; }
    .meal-label { font-weight: bold; font-size: 11px; color: #C09070; text-transform: uppercase; margin-bottom: 4px; }
    .transcript { font-size: 14px; line-height: 1.5; }
    .ressentis-block { margin: 10px 0; padding: 10px 12px; background: #F5F0FF; border-radius: 8px; border-left: 3px solid #8B5CF6; }
    .ressentis-title { font-weight: bold; font-size: 11px; color: #8B5CF6; text-transform: uppercase; margin-bottom: 6px; }
    .ressenti-item { font-size: 13px; color: #4C1D95; margin: 3px 0; }
    .ressenti-note { font-style: italic; color: #6D28D9; }
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

export async function exportJournalAsPdf(
  entries: Entry[],
  ressentis: Ressenti[],
  firstName: string,
  periodLabel: string,
  primaryColor: string
): Promise<void> {
  const html = generateJournalHtml(entries, ressentis, firstName, periodLabel, primaryColor);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
