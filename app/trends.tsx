import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useTrends, DayScore } from '@/hooks/useTrends';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const SLEEP_EMOJI: Record<number, string> = { 1: '😣', 2: '😐', 3: '😊' };
const BAR_MAX_HEIGHT = 120;

function scoreColor(score: number): string {
  if (score >= 8) return '#22C55E';
  if (score >= 6) return '#84CC16';
  if (score >= 4) return '#EAB308';
  if (score >= 2) return '#F97316';
  return '#EF4444';
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function formatWeekLabel(from: string, to: string): string {
  return `${formatDate(from)} → ${formatDate(to)}`;
}

function getDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function DayBar({ day, isToday }: { day: DayScore; isToday: boolean }) {
  const barHeight = Math.max(4, Math.round((day.score / 10) * BAR_MAX_HEIGHT));
  const color = scoreColor(day.score);

  return (
    <View style={styles.dayCol}>
      {/* Indicateurs */}
      <View style={styles.indicators}>
        {day.sleepQuality !== null && (
          <Text style={styles.indicatorEmoji}>{SLEEP_EMOJI[day.sleepQuality]}</Text>
        )}
        {day.painCount > 0 && (
          <Text style={styles.indicatorEmoji}>🔴</Text>
        )}
        {day.activityMinutes >= 30 && (
          <Text style={styles.indicatorEmoji}>✅</Text>
        )}
      </View>

      {/* Barre */}
      <View style={styles.barContainer}>
        <View style={[styles.bar, { height: barHeight, backgroundColor: color }]} />
      </View>

      {/* Score */}
      <Text style={[styles.scoreLabel, { color }]}>{day.score}</Text>

      {/* Jour */}
      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
        {getDayLabel(day.date)}
      </Text>
      <Text style={styles.dateLabel}>{formatDate(day.date)}</Text>
    </View>
  );
}

export default function TrendsScreen() {
  const router = useRouter();
  const { primary } = useColorTheme();
  const { days, loading, from, to, goBack, goForward, isCurrentWeek, avgScore } = useTrends();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: primary }]}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📈 Tendances</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Navigation semaine */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goBack} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{formatWeekLabel(from, to)}</Text>
          <TouchableOpacity
            onPress={goForward}
            style={[styles.navBtn, isCurrentWeek && styles.navBtnDisabled]}
            disabled={isCurrentWeek}
          >
            <Text style={[styles.navBtnText, isCurrentWeek && styles.navBtnTextDisabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Score moyen */}
        {avgScore !== null && (
          <View style={[styles.avgCard, { borderColor: scoreColor(avgScore) }]}>
            <Text style={styles.avgLabel}>Score moyen de la semaine</Text>
            <Text style={[styles.avgScore, { color: scoreColor(avgScore) }]}>{avgScore} / 10</Text>
          </View>
        )}

        {/* Graphique */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={primary} />
        ) : (
          <View style={styles.chart}>
            {days.map(day => (
              <DayBar key={day.date} day={day} isToday={day.date === today} />
            ))}
          </View>
        )}

        {/* Légende */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Légende</Text>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>😣😐😊 Qualité de sommeil</Text>
            <Text style={styles.legendItem}>🔴 Douleur signalée</Text>
            <Text style={styles.legendItem}>✅ Objectif activité (30min)</Text>
          </View>
          <Text style={styles.legendScore}>
            Score = sommeil (0-4) + douleur (0-3) + activité (0-2) + bien-être (0-1)
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0D0B8',
  },
  backBtn: { width: 70 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#2D1A0E' },
  content: { padding: 20, paddingBottom: 48 },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E9D5FF',
  },
  navBtnDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E5E5E5' },
  navBtnText: { fontSize: 22, color: '#6D28D9', fontWeight: '700', lineHeight: 26 },
  navBtnTextDisabled: { color: '#D1D5DB' },
  weekLabel: { fontSize: 15, fontWeight: '700', color: '#2D1A0E' },
  avgCard: {
    borderWidth: 2, borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 20, backgroundColor: 'white',
  },
  avgLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  avgScore: { fontSize: 32, fontWeight: '800' },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', marginBottom: 24,
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  indicators: { height: 48, justifyContent: 'flex-end', alignItems: 'center', gap: 1 },
  indicatorEmoji: { fontSize: 10, lineHeight: 14 },
  barContainer: {
    height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', alignItems: 'center', width: '100%',
  },
  bar: { width: '60%', borderRadius: 4 },
  scoreLabel: { fontSize: 11, fontWeight: '800' },
  dayLabel: { fontSize: 10, fontWeight: '700', color: '#5C3020' },
  dayLabelToday: { color: '#8B5CF6' },
  dateLabel: { fontSize: 9, color: '#C09070' },
  legend: {
    backgroundColor: '#F5F0FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  legendTitle: { fontSize: 11, fontWeight: '700', color: '#6D28D9', marginBottom: 8, textTransform: 'uppercase' },
  legendRow: { gap: 4, marginBottom: 8 },
  legendItem: { fontSize: 12, color: '#4C1D95' },
  legendScore: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
});
