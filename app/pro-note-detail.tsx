import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { useColorTheme } from '@/hooks/useColorTheme';
import { getProNote, updateProNote } from '@/db/proNotesRepository';
import { ProNote } from '@/types';

export default function ProNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { primary } = useColorTheme();
  const [note, setNote] = useState<ProNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProNote(Number(id)).then(n => {
      if (!n) return;
      setNote(n);
      setEditTitle(n.title);
      setEditContent(n.content ?? '');
    });
  }, [id]);

  async function handleSave() {
    if (!note) return;
    await updateProNote(note.id, editTitle.trim(), editContent.trim());
    setDirty(false);
    router.back();
  }

  async function handleOpenWithApp() {
    if (!note?.file_uri) return;
    const can = await Sharing.isAvailableAsync();
    if (!can) { Alert.alert('Partage non disponible'); return; }
    await Sharing.shareAsync(note.file_uri, {
      mimeType: note.file_type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      dialogTitle: 'Ouvrir avec…',
    });
  }

  if (!note) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ title: 'Note', headerShown: true, headerTintColor: primary }} />
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  const isFile = !!note.file_uri;
  const isPdf = note.file_type === 'pdf';

  return (
    <>
      <Stack.Screen options={{
        title: editTitle || note.title,
        headerShown: true,
        headerBackTitle: 'Notes',
        headerTintColor: primary,
        headerRight: () => isFile ? null : (
          <TouchableOpacity onPress={handleSave} disabled={!dirty}>
            <Text style={[styles.saveHeader, { color: dirty ? primary : '#C09070' }]}>Enregistrer</Text>
          </TouchableOpacity>
        ),
      }} />

      {isFile && isPdf ? (
        // PDF rendered natively in WebView on iOS
        <View style={styles.flex}>
          <WebView
            source={{ uri: note.file_uri! }}
            style={styles.flex}
            originWhitelist={['file://*', '*']}
          />
          <TouchableOpacity style={[styles.openBtn, { borderColor: primary }]} onPress={handleOpenWithApp}>
            <Text style={[styles.openBtnText, { color: primary }]}>Ouvrir avec une autre app…</Text>
          </TouchableOpacity>
        </View>
      ) : isFile ? (
        // Word / other → only share
        <View style={styles.docFallback}>
          <Text style={styles.docIcon}>📝</Text>
          <Text style={styles.docName}>{note.file_name}</Text>
          <Text style={styles.docHint}>Ouvre ce fichier dans Pages, Word ou une autre app compatible.</Text>
          <TouchableOpacity style={[styles.openBtnLarge, { backgroundColor: primary }]} onPress={handleOpenWithApp}>
            <Text style={styles.openBtnLargeText}>Ouvrir avec…</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Text note — editable
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TextInput
            style={[styles.titleInput, { borderColor: primary }]}
            value={editTitle}
            onChangeText={v => { setEditTitle(v); setDirty(true); }}
            placeholder="Titre"
            placeholderTextColor="#C09070"
          />
          <TextInput
            style={[styles.contentInput, { borderColor: primary }]}
            value={editContent}
            onChangeText={v => { setEditContent(v); setDirty(true); }}
            placeholder="Contenu de la note…"
            placeholderTextColor="#C09070"
            multiline
            textAlignVertical="top"
          />
          {dirty && (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 20, paddingBottom: 60 },
  saveHeader: { fontSize: 15, fontWeight: '600' },
  titleInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 17, fontWeight: '700', color: '#1C0A00',
    backgroundColor: 'white', marginBottom: 12,
  },
  contentInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 15, color: '#2D1A0E',
    backgroundColor: 'white', minHeight: 200,
  },
  saveBtn: { marginTop: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  openBtn: {
    margin: 16, borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  openBtnText: { fontSize: 14, fontWeight: '600' },
  docFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
    backgroundColor: '#FFF8F5',
  },
  docIcon: { fontSize: 64 },
  docName: { fontSize: 16, fontWeight: '700', color: '#1C0A00', textAlign: 'center' },
  docHint: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  openBtnLarge: { marginTop: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  openBtnLargeText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
