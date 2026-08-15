import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useTrends, DayScore, TrendsViewMode } from '@/hooks/useTrends';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const SLEEP_EMOJI: Record<number, string> = { 1: '😣', 2: '😐', 3: '😊' };
const BAR_MAX_HEIGHT = 160;

function scoreColor(score: number): string {
  if (score >= 8) return '#16A34A';
  if (score >= 6) return '#84CC16';
  if (score >= 4) return '#EAB308';
  if (score >= 2) return '#F97316';
  return '#EF4444';
}

function scoreBg(score: number): string {
  if (score >= 8) return '#DCFCE7';
  if (score >= 6) return '#ECFCCB';
  if (score >= 4) return '#FEF9C3';
  if (score >= 2) return '#FFEDD5';
  return '#FEE2E2';
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function getMonthLabel(from: string): string {
  const [y, m] = from.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function DayBar({ day, isToday, compact = false }: { day: DayScore; isToday: boolean; compact?: boolean }) {
  const maxH = compact ? 60 : BAR_MAX_HEIGHT;
  const barHeight = Math.max(3, Math.round((day.score / 10) * maxH));
  const color = scoreColor(day.score);
  const hasData = day.sleepQuality !== null || day.painCount > 0 || day.activityMinutes > 0 || day.goodCount > 0;

  if (compact) {
    return (
      <View style={styles.dayColCompact}>
        <View style={[styles.barContainerCompact]}>
          {hasData ? (
            <View style={[styles.barCompact, { height: barHeight, backgroundColor: color }]}>
              {day.painCount > 0 && <View style={styles.painDotCompact} />}
            </View>
          ) : (
            <View style={[styles.barCompact, styles.barEmpty, { height: 3 }]} />
          )}
        </View>
        {isToday && <View style={styles.todayDot} />}
      </View>
    );
  }

  return (
    <View style={styles.dayCol}>
      <Text style={styles.sleepEmoji}>
        {day.sleepQuality ? SLEEP_EMOJI[day.sleepQuality] : ' '}
      </Text>

      <View style={styles.barContainer}>
        {hasData ? (
          <View style={[styles.bar, { height: barHeight, backgroundColor: color }]}>
            {day.painCount > 0 && <View style={styles.painDot} />}
          </View>
        ) : (
          <View style={[styles.bar, styles.barEmpty, { height: 6 }]} />
        )}
      </View>

      <Text style={[styles.scoreLabel, { color: hasData ? color : '#D1D5DB' }]}>
        {hasData ? day.score : '—'}
      </Text>

      <View style={[styles.dayLabelBox, isToday && styles.dayLabelBoxToday]}>
        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
          {getDayLabel(day.date)}
        </Text>
      </View>
      <Text style={styles.dateLabel}>{formatDate(day.date)}</Text>
    </View>
  );
}

const MODE_OPTS: { id: TrendsViewMode; label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
];

export default function TrendsScreen() {
  const router = useRouter();
  const { primary } = useColorTheme();
  const { days, loading, from, to, goBack, goForward, isCurrentPeriod, avgScore, viewMode, switchMode } = useTrends();

  const today = new Date().toISOString().slice(0, 10);
  const fromFmt = formatDate(from);
  const toFmt = formatDate(to);
  const periodLabel = viewMode === 'month' ? getMonthLabel(from) : `${fromFmt} → ${toFmt}`;
  const currentLabel = viewMode === 'month' ? 'Ce mois' : 'Cette semaine';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backText, { color: primary }]}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tendances</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          {MODE_OPTS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.modeChip, viewMode === opt.id && styles.modeChipActive]}
              onPress={() => switchMode(opt.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeChipText, viewMode === opt.id && styles.modeChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation période */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goBack} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.weekLabelBox}>
            <Text style={styles.weekLabel}>{periodLabel}</Text>
            {isCurrentPeriod && <Text style={styles.weekSub}>{currentLabel}</Text>}
          </View>
          <TouchableOpacity
            onPress={goForward}
            style={[styles.navBtn, isCurrentPeriod && { opacity: 0.25 }]}
            disabled={isCurrentPeriod}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Score moyen */}
        {avgScore !== null && (
          <View style={[styles.avgCard, { backgroundColor: scoreBg(avgScore), borderColor: scoreColor(avgScore) + '40' }]}>
            <Text style={styles.avgLabel}>Score moyen</Text>
            <Text style={[styles.avgScore, { color: scoreColor(avgScore) }]}>
              {avgScore}<Text style={styles.avgMax}>/10</Text>
            </Text>
          </View>
        )}

        {/* Graphique */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={primary} />
        ) : viewMode === 'month' ? (
          <View style={styles.chartCard}>
            <View style={styles.chartMonth}>
              {days.map(day => (
                <DayBar key={day.date} day={day} isToday={day.date === today} compact />
              ))}
            </View>
            <View style={styles.inlineLegend}>
              <Text style={styles.legendChip}>🔴 douleur</Text>
              <Text style={styles.legendSep}>·</Text>
              <Text style={styles.legendChip}>• aujourd'hui</Text>
            </View>
          </View>
        ) : (
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {days.map(day => (
                <DayBar key={day.date} day={day} isToday={day.date === today} />
              ))}
            </View>

            {/* Mini légende inline */}
            <View style={styles.inlineLegend}>
              <Text style={styles.legendChip}>😣😐😊 sommeil</Text>
              <Text style={styles.legendSep}>·</Text>
              <Text style={styles.legendChip}>🔴 douleur</Text>
            </View>
          </View>
        )}

        {/* Détail du score */}
        <View style={styles.scoreDetail}>
          <Text style={styles.scoreDetailTitle}>Comment est calculé le score ?</Text>
          <View style={styles.scoreRows}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowEmoji}>🌙</Text>
              <Text style={styles.scoreRowText}>Sommeil — jusqu'à 4 pts</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowEmoji}>💜</Text>
              <Text style={styles.scoreRowText}>Absence de douleur — jusqu'à 3 pts</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowEmoji}>🏃</Text>
              <Text style={styles.scoreRowText}>Activité physique — jusqu'à 2 pts</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowEmoji}>😊</Text>
              <Text style={styles.scoreRowText}>Ressenti positif — 1 pt</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowEmoji}>💊</Text>
              <Text style={styles.scoreRowText}>Médicament efficace 😊 — 1 pt</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowEmoji}>🩹</Text>
              <Text style={styles.scoreRowText}>Accessoire aidant utilisé — 1 pt</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0D0B8',
  },
  backText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  title: { fontSize: 17, fontWeight: '700', color: '#1C0A00', letterSpacing: -0.4 },

  content: { padding: 20, paddingBottom: 56, gap: 16 },

  modeToggle: {
    flexDirection: 'row', backgroundColor: '#F3EEF8',
    borderRadius: 12, padding: 3, alignSelf: 'center',
  },
  modeChip: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10,
  },
  modeChipActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeChipText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  modeChipTextActive: { color: '#6D28D9' },

  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { fontSize: 24, color: '#6D28D9', fontWeight: '600', lineHeight: 28 },
  weekLabelBox: { alignItems: 'center', gap: 2 },
  weekLabel: { fontSize: 15, fontWeight: '700', color: '#1C0A00', letterSpacing: -0.3 },
  weekSub: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  avgCard: {
    borderWidth: 1.5, borderRadius: 16, padding: 20,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between',
  },
  avgLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', letterSpacing: 0.2, textTransform: 'uppercase' },
  avgScore: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  avgMax: { fontSize: 20, fontWeight: '500', letterSpacing: 0 },

  chartCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    gap: 12,
  },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', height: BAR_MAX_HEIGHT + 80,
  },
  chartMonth: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', height: 80,
  },

  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayColCompact: { flex: 1, alignItems: 'center', gap: 2 },
  sleepEmoji: { fontSize: 13, height: 18, textAlign: 'center' },
  barContainer: {
    flex: 1, justifyContent: 'flex-end', alignItems: 'center', width: '100%',
  },
  barContainerCompact: {
    height: 60, justifyContent: 'flex-end', alignItems: 'center', width: '100%',
  },
  bar: { width: '65%', borderRadius: 6, overflow: 'hidden', alignItems: 'center' },
  barCompact: { width: '70%', borderRadius: 3, overflow: 'hidden', alignItems: 'center' },
  barEmpty: { backgroundColor: '#F3F4F6' },
  painDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'white', position: 'absolute', top: 5,
  },
  painDotCompact: {
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: 'white', position: 'absolute', top: 3,
  },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#6D28D9', marginTop: 2,
  },
  scoreLabel: { fontSize: 12, fontWeight: '800', letterSpacing: -0.3 },
  dayLabelBox: {
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6,
  },
  dayLabelBoxToday: { backgroundColor: '#EDE9FE' },
  dayLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.2 },
  dayLabelToday: { color: '#6D28D9' },
  dateLabel: { fontSize: 9, color: '#C09070', letterSpacing: 0.1 },

  inlineLegend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  legendChip: { fontSize: 11, color: '#9CA3AF' },
  legendSep: { fontSize: 11, color: '#D1D5DB' },

  scoreDetail: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 12,
  },
  scoreDetailTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  scoreRows: { gap: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreRowEmoji: { fontSize: 18, width: 26 },
  scoreRowText: { fontSize: 14, color: '#374151', fontWeight: '500', letterSpacing: -0.1 },
});
