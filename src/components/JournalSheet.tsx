import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useJournalStore } from '@/store/journalStore';
import { JournalTimeline } from '@/components/JournalTimeline';
import { formatDateLabel, formatDate } from '@/utils/dateUtils';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';
import { updateEntryTranscript, updateEntryPhoto } from '@/db/entriesRepository';
import { Entry } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

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
    ressentis,
    viewedDate,
    closeSheet,
    goToPreviousDay,
    goToNextDay,
    refreshCurrentDay,
  } = useJournalStore();

  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editText, setEditText] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);

  function handleEditEntry(entry: Entry) {
    setEditingEntry(entry);
    setEditText(entry.transcript);
    setEditPhoto(entry.photo_uri ?? null);
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setEditPhoto(result.assets[0].uri);
    }
  }

  async function handleTakePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setEditPhoto(result.assets[0].uri);
    }
  }

  async function handleSaveEdit() {
    if (!editingEntry) return;
    await updateEntryTranscript(editingEntry.id, editText.trim());
    if (editPhoto !== (editingEntry.photo_uri ?? null)) {
      await updateEntryPhoto(editingEntry.id, editPhoto);
    }
    setEditingEntry(null);
    await refreshCurrentDay();
  }

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
          ressentis={ressentis}
          onEditEntry={handleEditEntry}
        />
      </ScrollView>

      <TouchableOpacity
        testID="add-entry-btn"
        onPress={onAddEntry}
        style={[styles.addBtn, { backgroundColor: primaryColor }]}
      >
        <Text style={styles.addBtnText}>🎙 Ajouter</Text>
      </TouchableOpacity>

      <Modal
        visible={!!editingEntry}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingEntry(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Modifier la note</Text>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              placeholder="Ta note…"
              placeholderTextColor="#C09070"
            />

            {editPhoto ? (
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: editPhoto }} style={styles.photoPreview} />
                <TouchableOpacity onPress={() => setEditPhoto(null)} style={styles.removePhotoBtn}>
                  <Text style={styles.removePhotoText}>✕ Supprimer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPickerRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                  <Text style={styles.photoBtnText}>📷 Prendre une photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
                  <Text style={styles.photoBtnText}>🖼 Galerie</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditingEntry(null)}
              >
                <Text style={styles.editCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, { backgroundColor: primaryColor }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editSaveText}>✓ Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editModal: {
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  editModalTitle: { fontSize: 16, fontWeight: '700', color: '#2D1A0E' },
  editInput: {
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#2D1A0E',
    minHeight: 80,
    backgroundColor: 'white',
  },
  editModalActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  editCancelBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#F0E8E0',
  },
  editCancelText: { fontSize: 14, fontWeight: '600', color: '#9070A0' },
  editSaveBtn: {
    flex: 2, padding: 12, borderRadius: 10, alignItems: 'center',
  },
  editSaveText: { fontSize: 14, fontWeight: '700', color: 'white' },
  photoPickerRow: { flexDirection: 'row', gap: 8 },
  photoBtn: {
    flex: 1, padding: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#FFF0E8', borderWidth: 1.5, borderColor: '#F0C0A0',
  },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  photoPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoPreview: { width: 80, height: 60, borderRadius: 8 },
  removePhotoBtn: { padding: 6 },
  removePhotoText: { fontSize: 12, color: '#C09070', fontWeight: '600' },
});
