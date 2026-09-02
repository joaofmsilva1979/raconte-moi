import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { exportJournalAsPdf } from '@/services/pdfService';
import { getEntriesForDateRange } from '@/db/entriesRepository';
import { getRessentisForDateRange } from '@/db/ressentisRepository';
import { getActivitiesForDateRange } from '@/db/activitiesRepository';
import { getSleepForDateRange } from '@/db/sleepRepository';
import { settingsStyles } from './settingsStyles';

function todayStr() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function parseFrDate(frDate: string): string | null {
  const parts = frDate.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function PdfExportSection() {
  const { settings } = useSettingsStore();
  const { primary } = useColorTheme();

  const [customFrom, setCustomFrom] = useState(() => daysAgoStr(7));
  const [customTo, setCustomTo] = useState(() => todayStr());
  const [isExporting, setIsExporting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  function applyPreset(days: number) {
    setCustomFrom(daysAgoStr(days));
    setCustomTo(todayStr());
  }

  async function exportRange(fromFr: string, toFr: string, label: string) {
    const from = parseFrDate(fromFr);
    const to = parseFrDate(toFr);
    if (!from || !to) {
      setDateError('Format invalide — utilise JJ/MM/AAAA');
      return;
    }
    setDateError(null);
    setIsExporting(true);
    try {
      const [entries, ressentis, activities, sleepLogs] = await Promise.all([
        getEntriesForDateRange(from, to),
        getRessentisForDateRange(from, to),
        getActivitiesForDateRange(from, to),
        getSleepForDateRange(from, to),
      ]);
      if (entries.length === 0 && ressentis.length === 0 && activities.length === 0) {
        Alert.alert('Aucune donnée', 'Pas de notes ou de ressentis sur cette période.');
        return;
      }
      await exportJournalAsPdf(entries, ressentis, settings?.first_name ?? '', label, primary, from, to, activities, sleepLogs);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <View style={settingsStyles.card}>
      <Text style={settingsStyles.rowSub}>Période rapide</Text>
      <View style={styles.presetRow}>
        {([7, 14, 30, 90] as const).map(days => (
          <TouchableOpacity
            key={days}
            style={[styles.presetBtn, { borderColor: primary }]}
            onPress={() => applyPreset(days)}
          >
            <Text style={[styles.presetText, { color: primary }]}>
              {days < 30 ? `${days}j` : days === 30 ? '1 mois' : '3 mois'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateRangeRow}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>Du</Text>
          <TextInput
            testID="export-from-input"
            style={[styles.dateInput, { borderColor: dateError ? '#DC2626' : primary }]}
            value={customFrom}
            onChangeText={v => { setCustomFrom(v); if (dateError) setDateError(null); }}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#C09070"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>Au</Text>
          <TextInput
            testID="export-to-input"
            style={[styles.dateInput, { borderColor: dateError ? '#DC2626' : primary }]}
            value={customTo}
            onChangeText={v => { setCustomTo(v); if (dateError) setDateError(null); }}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#C09070"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>
      {dateError && <Text style={styles.fieldError}>{dateError}</Text>}

      <TouchableOpacity
        testID="export-range-btn"
        style={[settingsStyles.actionBtn, { borderColor: primary, opacity: isExporting ? 0.6 : 1 }]}
        disabled={isExporting}
        onPress={() => {
          const label = `${customFrom} → ${customTo}`;
          exportRange(customFrom, customTo, label);
        }}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color={primary} />
        ) : (
          <Text style={[settingsStyles.actionBtnText, { color: primary }]}>📄 Exporter cette période</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  presetBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 8,
    paddingVertical: 6, alignItems: 'center',
  },
  presetText: { fontSize: 13, fontWeight: '700' },
  fieldError: { fontSize: 12, color: '#DC2626', marginTop: -8, marginBottom: 6 },
  dateRangeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateField: { flex: 1, gap: 4 },
  dateLabel: { fontSize: 11, color: '#C09070', fontWeight: '600', textTransform: 'uppercase' },
  dateInput: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, fontWeight: '600', color: '#2D1A0E',
    textAlign: 'center',
  },
});
