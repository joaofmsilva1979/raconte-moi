import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Entry, MealSlot } from '@/types';
import { formatTime } from '@/utils/dateUtils';

interface JournalTimelineProps {
  entries: Entry[];
  slots: MealSlot[];
  primaryColor: string;
}

export function JournalTimeline({ entries, slots, primaryColor }: JournalTimelineProps) {
  return (
    <View style={styles.container} testID="journal-timeline">
      {slots.map((slot, idx) => {
        const slotEntries = entries.filter((e) => e.meal_type === slot.meal_type);
        const isLast = idx === slots.length - 1;
        return (
          <View key={slot.meal_type} style={styles.row} testID={`timeline-slot-${slot.meal_type}`}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, { backgroundColor: primaryColor }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: primaryColor + '40' }]} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.slotLabel}>
                {slot.icon} {slot.label}
              </Text>
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
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C3020',
    marginBottom: 4,
  },
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
});
