import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Entry, MealSlot, Ressenti } from '@/types';
import { formatTime } from '@/utils/dateUtils';
import { RESSENTI_LABELS, RESSENTI_ICONS, SUB_CATEGORY_LABELS } from '@/constants/ressentis';

interface JournalTimelineProps {
  entries: Entry[];
  slots: MealSlot[];
  primaryColor: string;
  ressentis?: Ressenti[];
  onEditEntry?: (entry: Entry) => void;
}

type TimelineItem = {
  kind: 'meal';
  slot: MealSlot;
  slotEntries: Entry[];
  slotRessentis: Ressenti[];
  sortKey: number;
};

function buildTimeline(
  entries: Entry[],
  ressentis: Ressenti[],
  slots: MealSlot[]
): TimelineItem[] {
  return slots
    .map((slot) => ({
      kind: 'meal' as const,
      slot,
      slotEntries: entries.filter((e) => e.meal_type === slot.meal_type),
      slotRessentis: ressentis.filter((r) => r.meal_type === slot.meal_type),
      sortKey: slot.start_hour * 60,
    }))
    .sort((a, b) => a.sortKey - b.sortKey);
}

export function JournalTimeline({ entries, slots, primaryColor, ressentis = [], onEditEntry }: JournalTimelineProps) {
  const timeline = buildTimeline(entries, ressentis, slots);
  const orphanRessentis = ressentis.filter(r => r.meal_type == null);

  return (
    <View style={styles.container} testID="journal-timeline">
      {timeline.map((item, idx) => {
        const { slot, slotEntries, slotRessentis } = item;
        const isLast = idx === timeline.length - 1;

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
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    testID={`entry-${entry.id}`}
                    onPress={() => onEditEntry?.(entry)}
                    activeOpacity={onEditEntry ? 0.7 : 1}
                  >
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTime}>{formatTime(entry.recorded_at)}</Text>
                      {onEditEntry && <Text style={styles.editHint}>✏️</Text>}
                    </View>
                    <Text style={styles.entryText}>{entry.transcript}</Text>
                    {entry.photo_uri && (
                      <Image source={{ uri: entry.photo_uri }} style={styles.entryPhoto} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.pendingCard} testID={`pending-${slot.meal_type}`}>
                  <Text style={styles.pendingText}>En attente…</Text>
                </View>
              )}

              {slotRessentis.map((ressenti) => {
                const label = RESSENTI_LABELS[ressenti.category];
                const icon = RESSENTI_ICONS[ressenti.category];
                const subLabel = ressenti.sub_category ? ` · ${SUB_CATEGORY_LABELS[ressenti.sub_category]}` : '';
                const delayLabel = ressenti.delay_minutes != null
                  ? ` · ~${ressenti.delay_minutes < 60
                      ? ressenti.delay_minutes + 'min'
                      : Math.round(ressenti.delay_minutes / 60) + 'h'} après`
                  : '';
                return (
                  <View key={ressenti.id} style={styles.ressentisCard} testID={`ressenti-card-${ressenti.id}`}>
                    <Text style={styles.ressentisTime}>{formatTime(ressenti.recorded_at)}</Text>
                    <Text style={styles.ressentisText}>{icon} {label}{subLabel}{delayLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {orphanRessentis.length > 0 && (
        <View style={styles.row} testID="timeline-orphan-ressentis">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>💜 Ressentis</Text>
            {orphanRessentis.map((ressenti) => {
              const label = RESSENTI_LABELS[ressenti.category];
              const icon = RESSENTI_ICONS[ressenti.category];
              const subLabel = ressenti.sub_category ? ` · ${SUB_CATEGORY_LABELS[ressenti.sub_category]}` : '';
              const delayLabel = ressenti.delay_minutes != null
                ? ` · ~${ressenti.delay_minutes < 60 ? ressenti.delay_minutes + 'min' : Math.round(ressenti.delay_minutes / 60) + 'h'} après`
                : '';
              return (
                <View key={ressenti.id} style={styles.ressentisCard} testID={`ressenti-card-${ressenti.id}`}>
                  <Text style={styles.ressentisTime}>{formatTime(ressenti.recorded_at)}</Text>
                  <Text style={styles.ressentisText}>{icon} {label}{subLabel}{delayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  entryTime: { fontSize: 10, fontWeight: '700', color: '#5C3020' },
  editHint: { fontSize: 10, opacity: 0.5 },
  entryText: { fontSize: 12, color: '#4A2F20', lineHeight: 16 },
  entryPhoto: { width: '100%', height: 120, borderRadius: 6, marginTop: 6 },
  pendingCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F0C0A0',
    borderRadius: 8,
    padding: 8,
  },
  pendingText: { fontSize: 11, color: '#C09070', fontStyle: 'italic' },
  ressentisCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 8,
  },
  ressentisTime: { fontSize: 10, fontWeight: '700', color: '#6D28D9', marginBottom: 2 },
  ressentisText: { fontSize: 12, color: '#4C1D95', lineHeight: 16 },
});
