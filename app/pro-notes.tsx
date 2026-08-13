import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useColorTheme } from '@/hooks/useColorTheme';
import { getProNotes, createProNote, deleteProNote } from '@/db/proNotesRepository';
import { ProNote } from '@/types';
import { useRouter } from 'expo-router';

export default function ProNotesScreen() {
  const router = useRouter();
  const { primary } = useColorTheme();
  const [notes, setNotes] = useState<ProNote[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'text' | 'file' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  async function load() {
    setNotes(await getProNotes());
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleAddText() {
    const title = newTitle.trim();
    if (!title) { Alert.alert('Titre requis', 'Donne un titre à ta note.'); return; }
    await createProNote({ title, content: newContent.trim() || undefined, file_type: 'text' });
    setNewTitle(''); setNewContent(''); setAddMode(null); setShowAdd(false);
    load();
  }

  async function handleImportFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
      copyToCacheDirectory: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const ext = asset.name.split('.').pop()?.toLowerCase();
    const fileType = ext === 'pdf' ? 'pdf' : 'docx';

    // Copy file into app Documents so it survives
    const destDir = (FileSystem.documentDirectory ?? '') + 'pro_notes/';
    const destInfo = await FileSystem.getInfoAsync(destDir);
    if (!destInfo.exists) await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });

    const destUri = destDir + asset.name;
    await FileSystem.copyAsync({ from: asset.uri, to: destUri });

    const title = newTitle.trim() || asset.name.replace(/\.[^.]+$/, '');
    await createProNote({ title, file_uri: destUri, file_name: asset.name, file_type: fileType });
    setNewTitle(''); setAddMode(null); setShowAdd(false);
    load();
  }

  async function handleDelete(note: ProNote) {
    Alert.alert('Supprimer ?', `"${note.title}" sera supprimée définitivement.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          if (note.file_uri) {
            try { await FileSystem.deleteAsync(note.file_uri, { idempotent: true }); } catch {}
          }
          await deleteProNote(note.id);
          load();
        },
      },
    ]);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Notes professionnelles',
        headerShown: true,
        headerBackTitle: 'Accueil',
        headerTintColor: primary,
      }} />
      <ScrollView style={[styles.scroll, { backgroundColor: '#FFF8F5' }]} contentContainerStyle={styles.content}>

        {notes.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune note</Text>
            <Text style={styles.emptySubtitle}>
              Importe un document de ton professionnel de santé ou ajoute une note manuelle.
            </Text>
          </View>
        )}

        {notes.map(note => (
          <TouchableOpacity
            key={note.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/pro-note-detail', params: { id: String(note.id) } })}
            onLongPress={() => handleDelete(note)}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcon}>
                {note.file_type === 'pdf' ? '📄' : note.file_type === 'docx' ? '📝' : '📋'}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{note.title}</Text>
              {note.file_name && <Text style={styles.cardSub}>{note.file_name}</Text>}
              {note.content && !note.file_uri && (
                <Text style={styles.cardPreview} numberOfLines={2}>{note.content}</Text>
              )}
              <Text style={styles.cardDate}>{formatDate(note.updated_at)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.hint}>Appui long pour supprimer</Text>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => { setShowAdd(true); setAddMode(null); setNewTitle(''); setNewContent(''); }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAdd(false)} />
          <View style={styles.addSheet}>
            <View style={styles.handle} />
            <Text style={styles.addTitle}>Ajouter une note</Text>

            {addMode === null && (
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeBtn, { borderColor: primary }]}
                  onPress={() => setAddMode('text')}
                >
                  <Text style={styles.modeBtnIcon}>✏️</Text>
                  <Text style={[styles.modeBtnLabel, { color: primary }]}>Note manuelle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, { borderColor: primary }]}
                  onPress={() => { setAddMode('file'); handleImportFile(); }}
                >
                  <Text style={styles.modeBtnIcon}>📎</Text>
                  <Text style={[styles.modeBtnLabel, { color: primary }]}>Importer PDF / Word</Text>
                </TouchableOpacity>
              </View>
            )}

            {addMode === 'text' && (
              <View style={styles.textForm}>
                <TextInput
                  style={[styles.titleInput, { borderColor: primary }]}
                  placeholder="Titre"
                  placeholderTextColor="#C09070"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
                <TextInput
                  style={[styles.contentInput, { borderColor: primary }]}
                  placeholder="Contenu — aliments à éviter, conseils, posologie…"
                  placeholderTextColor="#C09070"
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: primary }]} onPress={handleAddText}>
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            )}

            {addMode === 'file' && (
              <View style={styles.fileWait}>
                <Text style={styles.fileWaitText}>Sélection du fichier en cours…</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C0A00' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#2D1A0E',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLeft: { marginRight: 12, paddingTop: 2 },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C0A00', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  cardPreview: { fontSize: 13, color: '#5C3020', lineHeight: 18, marginBottom: 4 },
  cardDate: { fontSize: 11, color: '#C09070' },
  hint: { fontSize: 11, color: '#D1C4B8', textAlign: 'center', marginTop: 16 },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { fontSize: 28, color: 'white', lineHeight: 32 },
  modalBackdrop: { flex: 1 },
  addSheet: {
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 48,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1C4B8',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  addTitle: { fontSize: 18, fontWeight: '800', color: '#1C0A00', marginBottom: 20 },
  modeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modeBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 20, alignItems: 'center', gap: 8,
    backgroundColor: 'white',
  },
  modeBtnIcon: { fontSize: 28 },
  modeBtnLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  textForm: { gap: 12 },
  titleInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, fontWeight: '600', color: '#1C0A00', backgroundColor: 'white',
  },
  contentInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#2D1A0E', backgroundColor: 'white',
    minHeight: 120, textAlignVertical: 'top',
  },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  fileWait: { alignItems: 'center', paddingVertical: 32 },
  fileWaitText: { fontSize: 14, color: '#9CA3AF' },
});
