import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Entry, MealSlot, Ressenti, Activity, SleepLog } from '@/types';
import { formatTime } from '@/utils/dateUtils';
import { RESSENTI_LABELS, RESSENTI_ICONS, SUB_CATEGORY_LABELS } from '@/constants/ressentis';
import { ACTIVITY_LABELS, ACTIVITY_ICONS } from '@/constants/activities';

interface JournalTimelineProps {
  entries: Entry[];
  slots: MealSlot[];
  primaryColor: string;
  ressentis?: Ressenti[];
  activities?: Activity[];
  sleepLog?: SleepLog | null;
  onEditEntry?: (entry: Entry) => void;
  onEditRessenti?: (ressenti: Ressenti) => void;
}

type TimelineItem = {
  kind: 'meal';
  slot: MealSlot;
  slotEntries: Entry[];
  slotRessentis: Ressenti[];
  sortKey: number;
};

function buildTimeline(entries: Entry[], ressentis: Ressenti[], slots: MealSlot[]): TimelineItem[] {
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

const SLEEP_LABEL: Record<number, string> = { 1: 'Mal dormi 😣', 2: 'Sommeil moyen 😐', 3: 'Bien dormi 😊' };
const SLEEP_COLOR: Record<number, string> = { 1: '#FEE2E2', 2: '#FEF9C3', 3: '#DCFCE7' };
const SLEEP_BORDER: Record<number, string> = { 1: '#FCA5A5', 2: '#FDE047', 3: '#86EFAC' };
const SLEEP_TEXT: Record<number, string>  = { 1: '#991B1B', 2: '#854D0E', 3: '#166534' };

function RessentisCard({ ressenti, onEdit }: { ressenti: Ressenti; onEdit?: (r: Ressenti) => void }) {
  const label = RESSENTI_LABELS[ressenti.category];
  const icon = RESSENTI_ICONS[ressenti.category];
  const subLabel = ressenti.sub_category
    ? ` · ${SUB_CATEGORY_LABELS[ressenti.sub_category] ?? ressenti.sub_category}`
    : '';
  const delayLabel = ressenti.delay_minutes != null
    ? ` · ~${ressenti.delay_minutes < 60 ? ressenti.delay_minutes + 'min' : Math.round(ressenti.delay_minutes / 60) + 'h'} après`
    : '';

  return (
    <TouchableOpacity
      style={styles.ressentisCard}
      testID={`ressenti-card-${ressenti.id}`}
      onPress={() => onEdit?.(ressenti)}
      activeOpacity={onEdit ? 0.7 : 1}
    >
      <View style={styles.ressentiHeader}>
        <Text style={styles.ressentisTime}>{formatTime(ressenti.recorded_at)}</Text>
        {onEdit && <Text style={styles.editHintPurple}>✏️</Text>}
      </View>
      <Text style={styles.ressentisText}>{icon} {label}{subLabel}{delayLabel}</Text>
      {ressenti.note ? <Text style={styles.ressentisNote}>"{ressenti.note}"</Text> : null}
    </TouchableOpacity>
  );
}

export function JournalTimeline({
  entries, slots, primaryColor, ressentis = [], activities = [],
  sleepLog, onEditEntry, onEditRessenti,
}: JournalTimelineProps) {
  const timeline = buildTimeline(entries, ressentis, slots);

  // Ressentis du réveil : context='morning' ou anciens sans context et sans meal_type
  const morningRessentis = ressentis.filter(r => r.context === 'morning');
  // Ressentis "comment tu te sens" sans repas lié (hors réveil)
  const freeRessentis = ressentis.filter(r => r.meal_type == null && r.context !== 'morning');
  const hasActivities = activities.length > 0;
  const hasMorning = morningRessentis.length > 0;
  const hasFree = freeRessentis.length > 0;

  // La dernière section ne doit pas avoir de ligne verticale
  const lastSectionIndex = hasActivities ? 2 : hasFree ? 1 : 0;
  const getMealIsLast = (idx: number) => idx === timeline.length - 1 && lastSectionIndex === 0;

  return (
    <View style={styles.container} testID="journal-timeline">

      {/* Qualité de sommeil */}
      {sleepLog && (
        <View style={[styles.sleepBanner, {
          backgroundColor: SLEEP_COLOR[sleepLog.quality],
          borderColor: SLEEP_BORDER[sleepLog.quality],
        }]}>
          <Text style={[styles.sleepText, { color: SLEEP_TEXT[sleepLog.quality] }]}>
            🌙 {SLEEP_LABEL[sleepLog.quality]}
          </Text>
        </View>
      )}

      {/* Ressentis du réveil — toujours en haut, avant les repas */}
      {hasMorning && (
        <View style={styles.row} testID="timeline-morning-ressentis">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
            <View style={[styles.line, { backgroundColor: '#8B5CF640' }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>☀️ Au réveil</Text>
            {morningRessentis.map((r) => (
              <RessentisCard key={r.id} ressenti={r} onEdit={onEditRessenti} />
            ))}
          </View>
        </View>
      )}

      {/* Sections repas */}
      {timeline.map((item, idx) => {
        const { slot, slotEntries, slotRessentis } = item;
        const isLast = getMealIsLast(idx);

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
              {slotRessentis.map((r) => (
                <RessentisCard key={r.id} ressenti={r} onEdit={onEditRessenti} />
              ))}
            </View>
          </View>
        );
      })}

      {/* Ressentis "comment tu te sens" sans repas — entre repas et activités */}
      {hasFree && (
        <View style={styles.row} testID="timeline-free-ressentis">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
            {hasActivities && <View style={[styles.line, { backgroundColor: '#8B5CF640' }]} />}
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>💜 Ressentis</Text>
            {freeRessentis.map((r) => (
              <RessentisCard key={r.id} ressenti={r} onEdit={onEditRessenti} />
            ))}
          </View>
        </View>
      )}

      {/* Activités — toujours tout en bas */}
      {hasActivities && (
        <View style={styles.row} testID="timeline-activities">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>🏃 Activité physique</Text>
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityCard} testID={`activity-card-${activity.id}`}>
                <Text style={styles.activityTime}>{formatTime(activity.recorded_at)}</Text>
                <Text style={styles.activityText}>
                  {ACTIVITY_ICONS[activity.activity_type]} {ACTIVITY_LABELS[activity.activity_type]} · {activity.duration_minutes}min
                </Text>
                {activity.note ? <Text style={styles.activityNote}>"{activity.note}"</Text> : null}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  sleepBanner: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 12,
  },
  sleepText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', marginBottom: 16 },
  dotCol: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { flex: 1, width: 2, marginTop: 4 },
  content: { flex: 1, paddingLeft: 8, gap: 4 },
  slotLabel: { fontSize: 12, fontWeight: '700', color: '#5C3020', marginBottom: 4 },
  entryCard: { backgroundColor: '#FDEEE8', borderRadius: 8, padding: 8 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  entryTime: { fontSize: 10, fontWeight: '700', color: '#5C3020' },
  editHint: { fontSize: 10, opacity: 0.5 },
  editHintPurple: { fontSize: 10, opacity: 0.5 },
  entryText: { fontSize: 12, color: '#4A2F20', lineHeight: 16 },
  entryPhoto: { width: '100%', height: 120, borderRadius: 6, marginTop: 6 },
  pendingCard: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#F0C0A0', borderRadius: 8, padding: 8 },
  pendingText: { fontSize: 11, color: '#C09070', fontStyle: 'italic' },
  ressentisCard: { backgroundColor: '#EDE9FE', borderRadius: 8, padding: 8 },
  ressentiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  ressentisTime: { fontSize: 10, fontWeight: '700', color: '#6D28D9' },
  ressentisText: { fontSize: 12, color: '#4C1D95', lineHeight: 16 },
  ressentisNote: { fontSize: 11, color: '#6D28D9', fontStyle: 'italic', marginTop: 3 },
  activityCard: { backgroundColor: '#DCFCE7', borderRadius: 8, padding: 8 },
  activityTime: { fontSize: 10, fontWeight: '700', color: '#166534', marginBottom: 2 },
  activityText: { fontSize: 12, color: '#14532D', fontWeight: '600', lineHeight: 16 },
  activityNote: { fontSize: 11, color: '#16A34A', fontStyle: 'italic', marginTop: 3 },
});
