import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useRecordingStore } from '@/store/recordingStore';
import { useRessentisStore } from '@/store/ressentisStore';
import { MealBadge } from '@/components/MealBadge';
import { RessentisSheet } from '@/components/RessentisSheet';
import * as ImagePicker from 'expo-image-picker';

export default function ConfirmScreen() {
  const router = useRouter();
  const { primary } = useColorTheme();
  const {
    editedText,
    rawText,
    wasReformulated,
    mealType,
    recordedAt,
    photoUri,
    updateEditedText,
    setPhotoUri,
    saveEntry,
    discard,
    reRecord,
  } = useRecordingStore();

  const { openSheet: openRessentisSheet } = useRessentisStore();
  const [showOriginal, setShowOriginal] = useState(false);

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
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    await saveEntry();
    router.replace('/');
  }

  function handleDiscard() {
    discard();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Vérifie ta note</Text>

        <MealBadge
          mealType={mealType}
          time={recordedAt ?? new Date()}
          onPress={() => router.push('/meal-picker')}
          primaryColor={primary}
        />

        <View style={styles.textSection}>
          {wasReformulated && (
            <Text style={styles.reformulatedLabel}>✨ Reformulé :</Text>
          )}
          <TextInput
            style={styles.textInput}
            value={editedText}
            onChangeText={updateEditedText}
            multiline
          />
          <Text style={styles.hint}>Tape pour corriger ou compléter</Text>
        </View>

        {wasReformulated && (
          <TouchableOpacity onPress={() => setShowOriginal((v) => !v)}>
            <Text style={[styles.link, { color: primary }]}>Voir original</Text>
          </TouchableOpacity>
        )}

        {showOriginal && (
          <View style={styles.originalBox}>
            <Text style={styles.originalText}>"{rawText}"</Text>
          </View>
        )}

        {wasReformulated && (
          <Text style={styles.reformuledBadge}>✨ reformulé</Text>
        )}

        {photoUri ? (
          <View style={styles.photoSection}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removePhotoBtn}>
              <Text style={styles.removePhotoText}>✕ Supprimer la photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
              <Text style={styles.photoBtnText}>📷 Photo du plat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
              <Text style={styles.photoBtnText}>🖼 Galerie</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          testID="add-ressenti-confirm-btn"
          onPress={openRessentisSheet}
          style={styles.btnRessenti}
        >
          <Text style={styles.btnRessentiText}>💜 Ajouter un ressenti</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="save-button"
          onPress={handleSave}
          style={[styles.btnPrimary, { backgroundColor: primary }]}
        >
          <Text style={styles.btnPrimaryText}>✓ Sauvegarder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="discard-button"
          onPress={handleDiscard}
          style={styles.btnSecondary}
        >
          <Text style={[styles.btnSecondaryText, { color: primary }]}>✕ Annuler</Text>
        </TouchableOpacity>

        <Text style={styles.privacy}>🔒 Restera sur cet iPhone</Text>
      </ScrollView>
      <RessentisSheet primaryColor={primary} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  scroll: { padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#2D1A0E' },
  textSection: { gap: 6 },
  reformulatedLabel: { fontSize: 12, color: '#C09070' },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#2D1A0E',
    minHeight: 60,
    backgroundColor: 'white',
  },
  hint: { fontSize: 11, color: '#C09070', fontStyle: 'italic', textAlign: 'center' },
  link: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  originalBox: { backgroundColor: '#F5F0F0', borderRadius: 10, padding: 12 },
  originalText: { fontSize: 13, color: '#8A6050', fontStyle: 'italic' },
  reformuledBadge: { fontSize: 11, color: '#9070C0', textAlign: 'center' },
  btnRessenti: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderWidth: 1.5,
    borderColor: '#D8B4FE',
  },
  btnRessentiText: { color: '#8B5CF6', fontWeight: '700', fontSize: 15 },
  btnPrimary: { borderRadius: 14, padding: 14, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: 16 },
  btnSecondary: {
    flex: 1,
    borderRadius: 12,
    padding: 11,
    alignItems: 'center',
    backgroundColor: '#FFF0E8',
    borderWidth: 1,
    borderColor: '#F0C0A0',
  },
  btnSecondaryText: { fontWeight: '600', fontSize: 13 },
  privacy: { fontSize: 11, color: '#C0B0A0', textAlign: 'center' },
  photoRow: { flexDirection: 'row', gap: 8 },
  photoBtn: {
    flex: 1, padding: 11, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#FFF0E8', borderWidth: 1.5, borderColor: '#F0C0A0',
  },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  photoSection: { gap: 8 },
  photoPreview: { width: '100%', height: 180, borderRadius: 12 },
  removePhotoBtn: { alignItems: 'center', padding: 4 },
  removePhotoText: { fontSize: 12, color: '#C09070', fontWeight: '600' },
});
