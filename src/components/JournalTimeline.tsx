import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Entry, MealSlot, Ressenti, Activity, SleepLog, MedicationLog, ComfortAidLog, HydrationLog } from '@/types';
import { formatTime } from '@/utils/dateUtils';
import { RESSENTI_LABELS, RESSENTI_ICONS, SUB_CATEGORY_LABELS } from '@/constants/ressentis';
import { getActivityLabel, getActivityIcon } from '@/constants/activities';

const TIMING_LABEL: Record<string, string> = {
  before: 'avant le repas',
  during: 'pendant',
  after: 'après le repas',
};

const EFFICACY_ICON: Record<number, string> = { 1: '😞', 2: '😐', 3: '😊' };

interface JournalTimelineProps {
  entries: Entry[];
  slots: MealSlot[];
  primaryColor: string;
  ressentis?: Ressenti[];
  activities?: Activity[];
  sleepLog?: SleepLog | null;
  medicationLogs?: MedicationLog[];
  comfortAidLogs?: ComfortAidLog[];
  hydrationLogs?: HydrationLog[];
  isPastDay?: boolean;
  onEditEntry?: (entry: Entry) => void;
  onDeleteEntry?: (entry: Entry) => void;
  onEditRessenti?: (ressenti: Ressenti) => void;
  onDeleteRessenti?: (id: number) => void;
  onDeleteActivity?: (id: number) => void;
  onDeleteMed?: (id: number) => void;
  onDeleteAid?: (id: number) => void;
  onDeleteSleep?: () => void;
  onDeleteHydration?: (id: number) => void;
}

type TimelineItem =
  | { kind: 'meal'; slot: MealSlot; slotEntries: Entry[]; slotRessentis: Ressenti[]; slotMeds: MedicationLog[]; slotAids: ComfortAidLog[]; sortKey: number }
  | { kind: 'feeling'; ressenti: Ressenti; sortKey: number }
  | { kind: 'med'; log: MedicationLog; sortKey: number }
  | { kind: 'aid'; log: ComfortAidLog; sortKey: number };

function toMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function buildTimeline(
  entries: Entry[],
  ressentis: Ressenti[],
  slots: MealSlot[],
  freeRessentis: Ressenti[],
  medicationLogs: MedicationLog[],
  comfortAidLogs: ComfortAidLog[],
): TimelineItem[] {
  const mealItems: TimelineItem[] = slots.map((slot) => ({
    kind: 'meal' as const,
    slot,
    slotEntries: entries.filter((e) => e.meal_type === slot.meal_type),
    slotRessentis: ressentis.filter((r) => r.meal_type === slot.meal_type),
    slotMeds: medicationLogs.filter((m) => m.meal_type === slot.meal_type),
    slotAids: comfortAidLogs.filter((a) => a.meal_type === slot.meal_type),
    sortKey: slot.start_hour * 60,
  }));

  const feelingItems: TimelineItem[] = freeRessentis.map((r) => ({
    kind: 'feeling' as const, ressenti: r, sortKey: toMinutes(r.recorded_at),
  }));

  const freeMeds = medicationLogs.filter((m) => !m.meal_type);
  const medItems: TimelineItem[] = freeMeds.map((m) => ({
    kind: 'med' as const, log: m, sortKey: toMinutes(m.recorded_at),
  }));

  // aids with 'morning' go to the morning section (filtered at render time); rest standalone
  const freeAids = comfortAidLogs.filter((a) => !a.meal_type || a.meal_type === 'morning');
  const aidItems: TimelineItem[] = freeAids
    .filter((a) => a.meal_type !== 'morning')
    .map((a) => ({ kind: 'aid' as const, log: a, sortKey: toMinutes(a.recorded_at) }));

  return [...mealItems, ...feelingItems, ...medItems, ...aidItems].sort((a, b) => a.sortKey - b.sortKey);
}

const SLEEP_LABEL: Record<number, string> = { 1: 'Mal dormi 😣', 2: 'Sommeil moyen 😐', 3: 'Bien dormi 😊' };
const SLEEP_COLOR: Record<number, string> = { 1: '#FEE2E2', 2: '#FEF9C3', 3: '#DCFCE7' };
const SLEEP_BORDER: Record<number, string> = { 1: '#FCA5A5', 2: '#FDE047', 3: '#86EFAC' };
const SLEEP_TEXT: Record<number, string>  = { 1: '#991B1B', 2: '#854D0E', 3: '#166534' };

function RessentisCard({ ressenti, onEdit, onDelete, standalone }: { ressenti: Ressenti; onEdit?: (r: Ressenti) => void; onDelete?: (id: number) => void; standalone?: boolean }) {
  const label = RESSENTI_LABELS[ressenti.category];
  const icon = RESSENTI_ICONS[ressenti.category];
  const subLabel = ressenti.sub_category
    ? ` · ${SUB_CATEGORY_LABELS[ressenti.sub_category] ?? ressenti.sub_category}`
    : '';
  const delayLabel = ressenti.delay_minutes != null
    ? ` · ~${ressenti.delay_minutes < 60 ? ressenti.delay_minutes + 'min' : Math.round(ressenti.delay_minutes / 60) + 'h'} après`
    : '';
  const timeLabel = standalone ? `💜 ${formatTime(ressenti.recorded_at)}` : formatTime(ressenti.recorded_at);

  return (
    <TouchableOpacity
      style={styles.ressentisCard}
      testID={`ressenti-card-${ressenti.id}`}
      onPress={() => onEdit?.(ressenti)}
      onLongPress={() => onDelete?.(ressenti.id)}
      delayLongPress={600}
      activeOpacity={onEdit ? 0.7 : 1}
    >
      <View style={styles.ressentiHeader}>
        <Text style={styles.ressentisTime}>{timeLabel}</Text>
        {onEdit && <Text style={styles.editHintPurple}>✏️</Text>}
      </View>
      <Text style={styles.ressentisText}>{icon} {label}{subLabel}{delayLabel}</Text>
      {ressenti.note ? <Text style={styles.ressentisNote}>"{ressenti.note}"</Text> : null}
    </TouchableOpacity>
  );
}

export function JournalTimeline({
  entries, slots, primaryColor, ressentis = [], activities = [],
  sleepLog, medicationLogs = [], comfortAidLogs = [], hydrationLogs = [], isPastDay = false,
  onEditEntry, onDeleteEntry, onEditRessenti,
  onDeleteRessenti, onDeleteActivity, onDeleteMed, onDeleteAid, onDeleteSleep, onDeleteHydration,
}: JournalTimelineProps) {
  const pastOpacity = isPastDay ? 0.72 : 1;
  const morningRessentis = ressentis.filter(r => r.context === 'morning');
  const morningAids = comfortAidLogs.filter(a => a.meal_type === 'morning');
  const freeRessentis = ressentis.filter(r => r.meal_type == null && r.context !== 'morning');
  const timeline = buildTimeline(entries, ressentis, slots, freeRessentis, medicationLogs, comfortAidLogs);

  const hasActivities = activities.length > 0;
  const hasHydration = hydrationLogs.length > 0;
  const hasMorning = morningRessentis.length > 0 || morningAids.length > 0;
  const totalMl = hydrationLogs.reduce((s, l) => s + l.amount_ml, 0);

  const getIsLast = (idx: number) => idx === timeline.length - 1 && !hasActivities;

  return (
    <View style={[styles.container, { opacity: pastOpacity }]} testID="journal-timeline">

      {/* Qualité de sommeil */}
      {sleepLog && (
        <TouchableOpacity
          onLongPress={onDeleteSleep}
          delayLongPress={600}
          activeOpacity={0.85}
          style={[styles.sleepBanner, {
            backgroundColor: SLEEP_COLOR[sleepLog.quality],
            borderColor: SLEEP_BORDER[sleepLog.quality],
          }]}
        >
          <Text style={[styles.sleepText, { color: SLEEP_TEXT[sleepLog.quality] }]}>
            🌙 {SLEEP_LABEL[sleepLog.quality]}
          </Text>
          {onDeleteSleep && <Text style={styles.longPressHint}>maintenir pour supprimer</Text>}
        </TouchableOpacity>
      )}

      {/* Ressentis + accessoires du réveil — toujours en haut, avant les repas */}
      {hasMorning && (
        <View style={styles.row} testID="timeline-morning-ressentis">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
            <View style={[styles.line, { backgroundColor: '#8B5CF640' }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>🌅 Au réveil</Text>
            {morningRessentis.map((r) => (
              <RessentisCard key={r.id} ressenti={r} onEdit={onEditRessenti} />
            ))}
            {morningAids.map((a) => (
              <TouchableOpacity key={`morning-aid-${a.id}`} style={styles.aidCard} onLongPress={() => onDeleteAid?.(a.id)} delayLongPress={600} activeOpacity={0.85}>
                <Text style={styles.aidTime}>🩹 {formatTime(a.recorded_at)}</Text>
                <Text style={styles.aidName}>{a.comfort_aid_name ?? '—'}</Text>
                {a.note ? <Text style={styles.aidNote}>"{a.note}"</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Timeline unifiée : repas + ressentis + médocs + accessoires triés chronologiquement */}
      {timeline.map((item, idx) => {
        const isLast = getIsLast(idx);

        if (item.kind === 'feeling') {
          return (
            <View key={`feeling-${item.ressenti.id}`} style={styles.row} testID={`timeline-feeling-${item.ressenti.id}`}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: '#8B5CF640' }]} />}
              </View>
              <View style={styles.content}>
                <RessentisCard ressenti={item.ressenti} onEdit={onEditRessenti} onDelete={onDeleteRessenti} standalone />
              </View>
            </View>
          );
        }

        if (item.kind === 'med') {
          const m = item.log;
          return (
            <View key={`med-${m.id}`} style={styles.row} testID={`timeline-med-${m.id}`}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: '#0369A1' }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: '#0369A140' }]} />}
              </View>
              <View style={styles.content}>
                <TouchableOpacity
                  style={styles.medCard}
                  onLongPress={() => onDeleteMed?.(m.id)}
                  delayLongPress={600}
                  activeOpacity={0.85}
                >
                  <Text style={styles.medTime}>💊 {formatTime(m.recorded_at)}</Text>
                  <Text style={styles.medName}>{m.medication_name ?? '—'}</Text>
                  <Text style={styles.medSub}>
                    {TIMING_LABEL[m.timing] ?? m.timing}
                    {m.efficacy != null ? `  ·  effet ${EFFICACY_ICON[m.efficacy]}` : ''}
                  </Text>
                  {m.note ? <Text style={styles.medNote}>"{m.note}"</Text> : null}
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        if (item.kind === 'aid') {
          const a = item.log;
          return (
            <View key={`aid-${a.id}`} style={styles.row} testID={`timeline-aid-${a.id}`}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: '#0EA5E9' }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: '#0EA5E940' }]} />}
              </View>
              <View style={styles.content}>
                <TouchableOpacity
                  style={styles.aidCard}
                  onLongPress={() => onDeleteAid?.(a.id)}
                  delayLongPress={600}
                  activeOpacity={0.85}
                >
                  <Text style={styles.aidTime}>🩹 {formatTime(a.recorded_at)}</Text>
                  <Text style={styles.aidName}>{a.comfort_aid_name ?? '—'}</Text>
                  {a.note ? <Text style={styles.aidNote}>"{a.note}"</Text> : null}
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        const { slot, slotEntries, slotRessentis, slotMeds, slotAids } = item;
        return (
          <View key={`meal-${slot.meal_type}`} style={styles.row} testID={`timeline-slot-${slot.meal_type}`}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, { backgroundColor: primaryColor }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: primaryColor + '40' }]} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.slotLabel}>{slot.icon} {slot.label}</Text>
              {slotMeds.filter(m => m.timing === 'before').map(m => (
                <TouchableOpacity key={`med-before-${m.id}`} style={styles.medCard} onLongPress={() => onDeleteMed?.(m.id)} delayLongPress={600} activeOpacity={0.85}>
                  <Text style={styles.medTime}>💊 {formatTime(m.recorded_at)} · avant</Text>
                  <Text style={styles.medName}>{m.medication_name ?? '—'}</Text>
                  {m.efficacy != null && <Text style={styles.medSub}>effet {EFFICACY_ICON[m.efficacy]}</Text>}
                  {m.note ? <Text style={styles.medNote}>"{m.note}"</Text> : null}
                </TouchableOpacity>
              ))}
              {slotEntries.length > 0 ? (
                slotEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    testID={`entry-${entry.id}`}
                    onPress={() => onEditEntry?.(entry)}
                    onLongPress={() => onDeleteEntry?.(entry)}
                    delayLongPress={600}
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
              {slotMeds.filter(m => m.timing !== 'before').map(m => (
                <TouchableOpacity key={`med-after-${m.id}`} style={styles.medCard} onLongPress={() => onDeleteMed?.(m.id)} delayLongPress={600} activeOpacity={0.85}>
                  <Text style={styles.medTime}>💊 {formatTime(m.recorded_at)} · {TIMING_LABEL[m.timing] ?? m.timing}</Text>
                  <Text style={styles.medName}>{m.medication_name ?? '—'}</Text>
                  {m.efficacy != null && <Text style={styles.medSub}>effet {EFFICACY_ICON[m.efficacy]}</Text>}
                  {m.note ? <Text style={styles.medNote}>"{m.note}"</Text> : null}
                </TouchableOpacity>
              ))}
              {slotRessentis.map((r) => (
                <RessentisCard key={r.id} ressenti={r} onEdit={onEditRessenti} onDelete={onDeleteRessenti} />
              ))}
              {slotAids.map((a) => (
                <TouchableOpacity key={`slot-aid-${a.id}`} style={styles.aidCard} onLongPress={() => onDeleteAid?.(a.id)} delayLongPress={600} activeOpacity={0.85}>
                  <Text style={styles.aidTime}>🩹 {formatTime(a.recorded_at)}</Text>
                  <Text style={styles.aidName}>{a.comfort_aid_name ?? '—'}</Text>
                  {a.note ? <Text style={styles.aidNote}>"{a.note}"</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {/* Activités — toujours tout en bas */}
      {hasActivities && (
        <View style={styles.row} testID="timeline-activities">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>🏃 Activité physique</Text>
            {activities.map((activity) => (
              <TouchableOpacity key={activity.id} style={styles.activityCard} testID={`activity-card-${activity.id}`} onLongPress={() => onDeleteActivity?.(activity.id)} delayLongPress={600} activeOpacity={0.85}>
                <Text style={styles.activityTime}>{formatTime(activity.recorded_at)}</Text>
                <Text style={styles.activityText}>
                  {getActivityIcon(activity.activity_type)} {getActivityLabel(activity.activity_type)} · {activity.duration_minutes}min
                </Text>
                {activity.note ? <Text style={styles.activityNote}>"{activity.note}"</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Hydratation */}
      {hasHydration && (
        <View style={styles.row} testID="timeline-hydration">
          <View style={styles.dotCol}>
            <View style={[styles.dot, { backgroundColor: '#0EA5E9' }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.slotLabel}>💧 Hydratation · {totalMl >= 1000 ? `${(totalMl / 1000).toFixed(1)} L` : `${totalMl} ml`}</Text>
            {hydrationLogs.map(log => (
              <TouchableOpacity key={log.id} style={styles.hydrationEntry} onLongPress={() => onDeleteHydration?.(log.id)} delayLongPress={600} activeOpacity={0.85}>
                <Text style={styles.hydrationTime}>{formatTime(log.recorded_at)}</Text>
                <Text style={styles.hydrationMl}>{log.amount_ml} ml</Text>
              </TouchableOpacity>
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
  slotLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  entryCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 10,
    shadowColor: '#7C3020', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: '#F0C0A0',
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  entryTime: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.2 },
  editHint: { fontSize: 11, opacity: 0.4 },
  editHintPurple: { fontSize: 11, opacity: 0.4 },
  entryText: { fontSize: 13, color: '#1C0A00', lineHeight: 18, letterSpacing: -0.1 },
  entryPhoto: { width: '100%', height: 120, borderRadius: 8, marginTop: 8 },
  pendingCard: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#E8D5C4',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  pendingText: { fontSize: 12, color: '#D0B8A8', fontStyle: 'italic' },
  ressentisCard: {
    backgroundColor: '#F5F0FF', borderRadius: 12, padding: 10,
    shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  ressentiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  ressentisTime: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', letterSpacing: 0.1 },
  ressentisText: { fontSize: 13, color: '#3B0764', lineHeight: 18, letterSpacing: -0.1 },
  ressentisNote: { fontSize: 12, color: '#7C3AED', fontStyle: 'italic', marginTop: 4 },
  activityCard: {
    backgroundColor: '#F0FFF4', borderRadius: 12, padding: 10,
    shadowColor: '#166534', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  activityTime: { fontSize: 11, fontWeight: '700', color: '#16A34A', marginBottom: 2, letterSpacing: 0.1 },
  activityText: { fontSize: 13, color: '#14532D', fontWeight: '600', lineHeight: 18, letterSpacing: -0.1 },
  activityNote: { fontSize: 12, color: '#16A34A', fontStyle: 'italic', marginTop: 4 },
  medCard: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#0369A1',
  },
  medTime: { fontSize: 11, fontWeight: '700', color: '#0369A1', marginBottom: 2, letterSpacing: 0.1 },
  medName: { fontSize: 13, color: '#1E3A5F', fontWeight: '600', lineHeight: 18 },
  medSub: { fontSize: 12, color: '#0369A1', marginTop: 2 },
  medNote: { fontSize: 12, color: '#0369A1', fontStyle: 'italic', marginTop: 4 },
  aidCard: {
    backgroundColor: '#F0F9FF', borderRadius: 12, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#0EA5E9',
  },
  aidTime: { fontSize: 11, fontWeight: '700', color: '#0EA5E9', marginBottom: 2, letterSpacing: 0.1 },
  aidName: { fontSize: 13, color: '#0C4A6E', fontWeight: '600', lineHeight: 18 },
  aidNote: { fontSize: 12, color: '#0EA5E9', fontStyle: 'italic', marginTop: 4 },
  longPressHint: { fontSize: 10, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' },
  hydrationEntry: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#BAE6FD',
  },
  hydrationTime: { fontSize: 12, color: '#0369A1' },
  hydrationMl: { fontSize: 12, fontWeight: '700', color: '#0369A1' },
});
