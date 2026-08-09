import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Entry, MealType } from '@/types';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
  other: 'Autre',
};

export function generateJournalHtml(
  entries: Entry[],
  firstName: string,
  periodLabel: string,
  primaryColor: string
): string {
  // Group entries by date (YYYY-MM-DD)
  const grouped: Record<string, Entry[]> = {};
  for (const entry of entries) {
    const dateKey = entry.recorded_at.slice(0, 10);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(entry);
  }

  // Sort dates chronologically
  const sortedDates = Object.keys(grouped).sort();

  // Build grouped HTML sections
  const groupedHtml = sortedDates
    .map((date) => {
      const dayEntries = grouped[date];
      const entriesHtml = dayEntries
        .map(
          (entry) => `
      <div class="entry">
        <div class="meal-label">${MEAL_LABELS[entry.meal_type]}</div>
        <div class="transcript">${entry.transcript}</div>
      </div>`
        )
        .join('');
      return `<h2>${date}</h2>${entriesHtml}`;
    })
    .join('');

  const exportDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; color: #2D1A0E; }
    h1 { color: ${primaryColor}; font-size: 24px; }
    h2 { color: ${primaryColor}; font-size: 16px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-top: 24px; }
    .entry { margin: 12px 0; padding: 10px; background: #FFF8F5; border-radius: 8px; }
    .meal-label { font-weight: bold; font-size: 12px; color: #C09070; text-transform: uppercase; }
    .transcript { font-size: 14px; margin-top: 4px; }
    .footer { margin-top: 40px; font-size: 11px; color: #C09070; text-align: center; }
  </style>
</head>
<body>
  <h1>🥔 Les notes de patate</h1>
  <p>${firstName} — ${periodLabel}</p>
  ${groupedHtml}
  <div class="footer">Généré le ${exportDate} — Les notes de patate (iOS)</div>
</body>
</html>`;
}

export async function exportJournalAsPdf(
  entries: Entry[],
  firstName: string,
  periodLabel: string,
  primaryColor: string
): Promise<void> {
  const html = generateJournalHtml(entries, firstName, periodLabel, primaryColor);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
