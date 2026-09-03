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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useJournalStore } from '@/store/journalStore';
import { JournalTimeline } from '@/components/JournalTimeline';
import { formatDateLabel, formatDate, addDays } from '@/utils/dateUtils';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';
import { updateEntryTranscript, updateEntryPhoto, deleteEntry, getActiveDates } from '@/db/entriesRepository';
import { updateRessenti } from '@/db/ressentisRepository';
import { Entry, Ressenti, RessentSubCategory } from '@/types';
import { RESSENTI_LABELS, RESSENTI_ICONS, RESSENTI_SUB_CATEGORIES } from '@/constants/ressentis';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

async function savePhotoToPermanentStorage(tempUri: string): Promise<string> {
  if (Platform.OS === 'web') return tempUri;
  const FileSystem = await import('expo-file-system/legacy');
  const dir = FileSystem.documentDirectory + 'photos/';
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const filename = `photo_${Date.now()}.jpg`;
  const dest = dir + filename;
  await FileSystem.moveAsync({ from: tempUri, to: dest });
  return dest;
}

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
    activities,
    sleepLog,
    medicationLogs,
    comfortAidLogs,
    hydrationLogs,
    viewedDate,
    closeSheet,
    loadDay,
    refreshCurrentDay,
    deleteRessentiLog,
    deleteActivityLog,
    deleteMedLog,
    deleteAidLog,
    deleteSleep,
    deleteHydrationEntry,
  } = useJournalStore();

  const today = formatDate(new Date());
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [stripAnchor, setStripAnchor] = useState(today);

  useEffect(() => {
    if (!isSheetOpen) return;
    const week = Array.from({ length: 7 }, (_, i) => addDays(stripAnchor, i - 6));
    getActiveDates(week).then(dates => setActiveDates(new Set(dates)));
  }, [isSheetOpen, stripAnchor, entries.length]);

  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editText, setEditText] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);

  const [editingRessenti, setEditingRessenti] = useState<Ressenti | null>(null);
  const [editRessentiNote, setEditRessentiNote] = useState('');
  const [editRessentiSub, setEditRessentiSub] = useState<RessentSubCategory | null>(null);

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
      const permanent = await savePhotoToPermanentStorage(result.assets[0].uri);
      setEditPhoto(permanent);
    }
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const permanent = await savePhotoToPermanentStorage(result.assets[0].uri);
      setEditPhoto(permanent);
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

  function handleEditRessenti(ressenti: Ressenti) {
    setEditingRessenti(ressenti);
    setEditRessentiNote(ressenti.note ?? '');
    setEditRessentiSub(ressenti.sub_category ?? null);
  }

  function handleDeleteEntry(entry: Entry) {
    Alert.alert('Supprimer ?', 'Supprimer cette note définitivement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          await deleteEntry(entry.id);
          await refreshCurrentDay();
        }
      },
    ]);
  }

  function confirmDelete(label: string, onConfirm: () => void) {
    Alert.alert('Supprimer ?', `Supprimer ${label} définitivement ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
    ]);
  }

  async function handleSaveRessentiEdit() {
    if (!editingRessenti) return;
    await updateRessenti(editingRessenti.id, {
      sub_category: editRessentiSub,
      note: editRessentiNote.trim() || null,
    });
    setEditingRessenti(null);
    await refreshCurrentDay();
  }

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
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

  const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(stripAnchor, i - 6));
  const canGoNextWeek = stripAnchor < today;

  return (
    <Animated.View
      testID="journal-sheet"
      style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY }] }]}
    >
      <View {...panResponder.panHandlers} testID="sheet-handle-area">
        <View style={styles.handle} testID="sheet-handle" />
      </View>

      <View style={styles.calendarHeader}>
        <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
          <Text style={styles.settingsLabel}>Réglages & Bilan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekStripRow}>
        <TouchableOpacity
          style={styles.weekNavBtn}
          onPress={() => setStripAnchor(a => addDays(a, -7))}
          testID="prev-week-btn"
        >
          <Text style={[styles.weekNavArrow, { color: primaryColor }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.weekStrip}>
          {weekDays.map((date) => {
            const isSelected = date === viewedDate;
            const isToday = date === today;
            const hasEntries = activeDates.has(date);
            const dayNum = parseInt(date.slice(8), 10);
            const dayOfWeek = new Date(date + 'T12:00:00').getDay();
            return (
              <TouchableOpacity
                key={date}
                testID={`day-chip-${date}`}
                style={[
                  styles.dayChip,
                  isSelected && { backgroundColor: primaryColor },
                  isToday && !isSelected && { borderColor: primaryColor, borderWidth: 1.5 },
                ]}
                onPress={() => loadDay(date)}
              >
                <Text style={[styles.dayLetter, isSelected && styles.dayTextSelected]}>
                  {DAY_LETTERS[dayOfWeek]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                  {dayNum}
                </Text>
                {hasEntries ? (
                  <View style={[styles.dayDot, { backgroundColor: isSelected ? 'rgba(255,255,255,0.75)' : primaryColor }]} />
                ) : (
                  <View style={styles.dayDotPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.weekNavBtn}
          onPress={() => {
            const next = addDays(stripAnchor, 7);
            setStripAnchor(next > today ? today : next);
          }}
          disabled={!canGoNextWeek}
          testID="next-week-btn"
        >
          <Text style={[styles.weekNavArrow, { color: canGoNextWeek ? primaryColor : '#D0C0B0' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <JournalTimeline
          entries={entries}
          slots={DEFAULT_MEAL_SLOTS}
          primaryColor={primaryColor}
          ressentis={ressentis}
          activities={activities}
          sleepLog={sleepLog}
          medicationLogs={medicationLogs}
          comfortAidLogs={comfortAidLogs}
          hydrationLogs={hydrationLogs}
          isPastDay={viewedDate < today}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          onEditRessenti={handleEditRessenti}
          onDeleteRessenti={(id) => confirmDelete('ce ressenti', () => deleteRessentiLog(id))}
          onDeleteActivity={(id) => confirmDelete('cette activité', () => deleteActivityLog(id))}
          onDeleteMed={(id) => confirmDelete('ce médicament', () => deleteMedLog(id))}
          onDeleteAid={(id) => confirmDelete('cet accessoire', () => deleteAidLog(id))}
          onDeleteSleep={() => sleepLog && confirmDelete('le log de sommeil', () => deleteSleep(sleepLog.id))}
          onDeleteHydration={(id) => confirmDelete('cette entrée eau', () => deleteHydrationEntry(id))}
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

            {editPhoto && (
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: editPhoto }} style={styles.photoPreview} />
                <TouchableOpacity onPress={() => setEditPhoto(null)} style={styles.removePhotoBtn}>
                  <Text style={styles.removePhotoText}>✕ Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.photoPickerRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                <Text style={styles.photoBtnText}>📷 {editPhoto ? 'Changer' : 'Prendre une photo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
                <Text style={styles.photoBtnText}>🖼 {editPhoto ? 'Changer' : 'Galerie'}</Text>
              </TouchableOpacity>
            </View>

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

      <Modal
        visible={!!editingRessenti}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingRessenti(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.editModal}>
            {editingRessenti && (
              <>
                <Text style={styles.editModalTitle}>
                  {RESSENTI_ICONS[editingRessenti.category]} {RESSENTI_LABELS[editingRessenti.category]}
                </Text>

                {editingRessenti.category === 'pain' && (
                  <View>
                    <Text style={styles.ressentiSubTitle}>Où as-tu mal ?</Text>
                    <View style={styles.subBtnsWrap}>
                      {RESSENTI_SUB_CATEGORIES.map((item) => {
                        const sel = editRessentiSub === item.sub;
                        return (
                          <TouchableOpacity
                            key={item.sub}
                            onPress={() => setEditRessentiSub(sel ? null : item.sub)}
                            style={[styles.subBtnEdit, sel && styles.subBtnEditSelected]}
                          >
                            <Text style={[styles.subBtnEditText, sel && styles.subBtnEditTextSelected]}>
                              {item.icon} {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <TextInput
                  style={styles.editInput}
                  value={editRessentiNote}
                  onChangeText={setEditRessentiNote}
                  multiline
                  placeholder="Note libre (optionnel)…"
                  placeholderTextColor="#C09070"
                />

                <View style={styles.editModalActions}>
                  <TouchableOpacity
                    style={styles.editCancelBtn}
                    onPress={() => setEditingRessenti(null)}
                  >
                    <Text style={styles.editCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, { backgroundColor: '#8B5CF6' }]}
                    onPress={handleSaveRessentiEdit}
                  >
                    <Text style={styles.editSaveText}>✓ Sauvegarder</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    width: 40,
    height: 4,
    backgroundColor: '#E0C8B8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  calendarHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  settingsBtn: { padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingsIcon: { fontSize: 15 },
  settingsLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', letterSpacing: 0.1 },
  weekStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8D5C4',
  },
  weekNavBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  weekNavArrow: { fontSize: 22, fontWeight: '500' },
  weekStrip: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 12,
    gap: 2,
  },
  dayLetter: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', letterSpacing: 0.5 },
  dayNumber: { fontSize: 15, fontWeight: '700', color: '#2D1A0E' },
  dayTextSelected: { color: 'white' },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  dayDotPlaceholder: { width: 5, height: 5 },
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
  ressentiSubTitle: { fontSize: 13, fontWeight: '700', color: '#6D28D9', marginBottom: 8 },
  subBtnsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  subBtnEdit: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E9D5FF', backgroundColor: '#F5F0FF',
  },
  subBtnEditSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  subBtnEditText: { fontSize: 12, fontWeight: '600', color: '#5C3020' },
  subBtnEditTextSelected: { color: '#6D28D9' },
});
