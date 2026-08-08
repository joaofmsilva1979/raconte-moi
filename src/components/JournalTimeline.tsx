import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Entry, MealSlot, Ressenti } from '@/types';
import { formatTime } from '@/utils/dateUtils';
import { RESSENTI_LABELS, RESSENTI_ICONS, SUB_CATEGORY_LABELS } from '@/constants/ressentis';

interface JournalTimelineProps {
  entries: Entry[];
  slots: MealSlot[];
  primaryColor: string;
  ressentis?: Ressenti[];
}

type TimelineItem =
  | { kind: 'meal'; slot: MealSlot; slotEntries: Entry[]; sortKey: number }
  | { kind: 'ressenti'; ressenti: Ressenti; sortKey: number };

function buildTimeline(
  entries: Entry[],
  ressentis: Ressenti[],
  slots: MealSlot[]
): TimelineItem[] {
  const mealItems: TimelineItem[] = slots.map((slot) => ({
    kind: 'meal',
    slot,
    slotEntries: entries.filter((e) => e.meal_type === slot.meal_type),
    sortKey: slot.start_hour * 60,
  }));

  const ressentisItems: TimelineItem[] = ressentis.map((r) => {
    const d = new Date(r.recorded_at);
    return {
      kind: 'ressenti',
      ressenti: r,
      sortKey: d.getHours() * 60 + d.getMinutes(),
    };
  });

  return [...mealItems, ...ressentisItems].sort((a, b) => a.sortKey - b.sortKey);
}

export function JournalTimeline({ entries, slots, primaryColor, ressentis = [] }: JournalTimelineProps) {
  const timeline = buildTimeline(entries, ressentis, slots);

  return (
    <View style={styles.container} testID="journal-timeline">
      {timeline.map((item, idx) => {
        const isLast = idx === timeline.length - 1;

        if (item.kind === 'meal') {
          const { slot, slotEntries } = item;
          return (
            <View key={`meal-${slot.meal_type}`} style={styles.row} testID={`timeline-slot-${slot.meal_type}`}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: primaryColor }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: primaryColor + '40' }]} />}
              </View>
              <View style={styles.content}>
                <Text style={styles.slotLabel}>{slot.icon} {slot.label}</Text>
                {slotEntries.length > 0 ? (
                  slotEntries.map((entry) => (
                    <View key={entry.id} style={styles.entryCard} testID={`entry-${entry.id}`}>
                      <Text style={styles.entryTime}>{formatTime(entry.recorded_at)}</Text>
                      <Text style={styles.entryText}>{entry.transcript}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.pendingCard} testID={`pending-${slot.meal_type}`}>
                    <Text style={styles.pendingText}>En attente…</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }

        const { ressenti } = item;
        const label = RESSENTI_LABELS[ressenti.category];
        const icon = RESSENTI_ICONS[ressenti.category];
        const subLabel = ressenti.sub_category ? ` · ${SUB_CATEGORY_LABELS[ressenti.sub_category]}` : '';
        const delayLabel =
          ressenti.delay_minutes != null
            ? ` · ~${ressenti.delay_minutes < 60
                ? ressenti.delay_minutes + 'min'
                : Math.round(ressenti.delay_minutes / 60) + 'h'} après le repas`
            : '';

        return (
          <View key={`ressenti-${ressenti.id}`} style={styles.row} testID={`timeline-ressenti-${ressenti.id}`}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: '#C4B5FD' }]} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.ressentisLabel}>💜 Ressenti</Text>
              <View style={styles.ressentisCard} testID={`ressenti-card-${ressenti.id}`}>
                <Text style={styles.ressentisTime}>{formatTime(ressenti.recorded_at)}</Text>
                <Text style={styles.ressentisText}>
                  {icon} {label}{subLabel}{delayLabel}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { flexDirection: 'row', marginBottom: 16 },
  dotCol: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { flex: 1, width: 2, marginTop: 4 },
  content: { flex: 1, paddingLeft: 8 },
  slotLabel: { fontSize: 12, fontWeight: '700', color: '#5C3020', marginBottom: 4 },
  entryCard: {
    backgroundColor: '#FDEEE8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  entryTime: { fontSize: 10, fontWeight: '700', color: '#5C3020', marginBottom: 2 },
  entryText: { fontSize: 12, color: '#4A2F20', lineHeight: 16 },
  pendingCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F0C0A0',
    borderRadius: 8,
    padding: 8,
  },
  pendingText: { fontSize: 11, color: '#C09070', fontStyle: 'italic' },
  ressentisLabel: { fontSize: 12, fontWeight: '700', color: '#6D28D9', marginBottom: 4 },
  ressentisCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 8,
  },
  ressentisTime: { fontSize: 10, fontWeight: '700', color: '#6D28D9', marginBottom: 2 },
  ressentisText: { fontSize: 12, color: '#4C1D95', lineHeight: 16 },
});
