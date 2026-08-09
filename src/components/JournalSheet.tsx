import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useJournalStore } from '@/store/journalStore';
import { JournalTimeline } from '@/components/JournalTimeline';
import { formatDateLabel, formatDate } from '@/utils/dateUtils';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const CLOSE_THRESHOLD = 80;

interface JournalSheetProps {
  primaryColor: string;
  onAddEntry: () => void;
}

export function JournalSheet({ primaryColor, onAddEntry }: JournalSheetProps) {
  const {
    isSheetOpen,
    entries,
    viewedDate,
    closeSheet,
    goToPreviousDay,
    goToNextDay,
  } = useJournalStore();

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const today = formatDate(new Date());
  const canGoNext = viewedDate < today;

  useEffect(() => {
    if (isSheetOpen) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isSheetOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 10,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy > CLOSE_THRESHOLD) {
          closeSheet();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!isSheetOpen) return null;

  const dateLabel = formatDateLabel(viewedDate);

  return (
    <Animated.View
      testID="journal-sheet"
      style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY }] }]}
    >
      <View {...panResponder.panHandlers} testID="sheet-handle-area">
        <View style={styles.handle} testID="sheet-handle" />
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToPreviousDay}
          testID="prev-day-btn"
          style={styles.navBtn}
        >
          <Text style={[styles.navArrow, { color: primaryColor }]}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.dateLabel}>{dateLabel}</Text>

        <TouchableOpacity
          onPress={goToNextDay}
          testID="next-day-btn"
          disabled={!canGoNext}
          style={styles.navBtn}
        >
          <Text style={[styles.navArrow, { color: canGoNext ? primaryColor : '#D0C0B0' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <JournalTimeline
          entries={entries}
          slots={DEFAULT_MEAL_SLOTS}
          primaryColor={primaryColor}
        />
      </ScrollView>

      <TouchableOpacity
        testID="add-entry-btn"
        onPress={onAddEntry}
        style={[styles.addBtn, { backgroundColor: primaryColor }]}
      >
        <Text style={styles.addBtnText}>🎙 Ajouter</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D0B8A8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0D0',
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, fontWeight: '600' },
  dateLabel: { fontSize: 14, fontWeight: '700', color: '#2D1A0E' },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12 },
  addBtn: {
    margin: 16,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
