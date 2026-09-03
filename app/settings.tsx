import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { COLOR_PALETTES } from '@/constants/colors';
import { resetAllData } from '@/db/database';
import { MealSlotsSection } from '@/components/settings/MealSlotsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { BackupSection } from '@/components/settings/BackupSection';
import { PdfExportSection } from '@/components/settings/PdfExportSection';
import { MedicationsSection } from '@/components/settings/MedicationsSection';
import { ComfortAidsSection } from '@/components/settings/ComfortAidsSection';

const GENDER_OPTIONS: { value: 'female' | 'male' | 'other'; label: string; icon: string }[] = [
  { value: 'female', label: 'Femme', icon: '♀️' },
  { value: 'male',   label: 'Homme', icon: '♂️' },
  { value: 'other',  label: 'Non défini', icon: '⚧' },
];

export default function SettingsScreen() {
  const { settings, saveFirstName, savePrimaryColor, loadSettings, saveGender } = useSettingsStore();
  const { primary } = useColorTheme();
  const router = useRouter();
  const [firstName, setFirstName] = useState(settings?.first_name ?? '');

  useEffect(() => {
    setFirstName(settings?.first_name ?? '');
  }, [settings?.first_name]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Réglages',
          headerShown: true,
          headerBackTitle: 'Accueil',
        }}
      />
      <ScrollView
        testID="settings-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil */}
        <Text style={styles.sectionTitle}>Mon profil</Text>
        <View style={styles.card}>
          <TextInput
            testID="firstname-input"
            style={[styles.textInput, { borderColor: primary }]}
            value={firstName}
            onChangeText={setFirstName}
            onBlur={() => saveFirstName(firstName)}
            placeholder="Ton prénom"
            placeholderTextColor="#C09070"
          />
          <View style={[styles.separator, { backgroundColor: primary + '30' }]} />
          <Text style={styles.genderLabel}>Profil de santé</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => saveGender(opt.value)}
                style={[
                  styles.genderBtn,
                  settings?.gender === opt.value && { backgroundColor: primary + '20', borderColor: primary },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.genderIcon}>{opt.icon}</Text>
                <Text style={[styles.genderBtnLabel, settings?.gender === opt.value && { color: primary, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Couleur */}
        <Text style={styles.sectionTitle}>Couleur</Text>
        <View style={styles.card}>
          <View style={styles.swatchGrid}>
            {COLOR_PALETTES.map(palette => (
              <TouchableOpacity
                key={palette.primary}
                testID={`color-swatch-${palette.primary}`}
                onPress={() => savePrimaryColor(palette.primary)}
                style={[
                  styles.swatch,
                  { backgroundColor: palette.primary },
                  settings?.primary_color === palette.primary && styles.swatchSelected,
                ]}
                activeOpacity={0.85}
              />
            ))}
          </View>
        </View>

        {/* Horaires */}
        <Text style={styles.sectionTitle}>Mes horaires</Text>
        <MealSlotsSection />

        {/* Rappels */}
        <Text style={styles.sectionTitle}>Rappels repas</Text>
        <NotificationsSection />

        {/* Sauvegarde */}
        <Text style={styles.sectionTitle}>SAUVEGARDE</Text>
        <BackupSection />

        {/* Bilan PDF */}
        <Text style={styles.sectionTitle}>BILAN</Text>
        <Text style={styles.sectionSubtitle}>À transférer à votre médecin</Text>
        <PdfExportSection />

        {/* Médicaments */}
        <Text style={styles.sectionTitle}>MES MÉDICAMENTS</Text>
        <MedicationsSection />

        {/* Accessoires aidants */}
        <Text style={styles.sectionTitle}>ACCESSOIRES AIDANTS</Text>
        <ComfortAidsSection />

        {/* Participer */}
        <Text style={styles.sectionTitle}>Participer</Text>
        <View style={styles.card}>
          <Text style={styles.participateText}>
            <Text style={styles.appName}>Raconte-moi</Text>
            {" est née d'une phrase murmurée : « ce serait tellement bien de pouvoir dire à haute voix ce qu'on a mangé, comment on se sent après (faire le lien entre les aliments, la fatigue et les douleurs du quotidien). » Faute de trouver un outil simple, privé et en français, je l'ai créé.\n\nSi tu utilises "}
            <Text style={styles.appName}>Raconte-moi</Text>
            {" et que tu as des retours (une idée, quelque chose qui te manque, une expérience à partager) ; je lis tout. Tes retours m'aideront à adapter encore mieux l'app à tes besoins, tout en restant fidèle à la ligne conductrice du début."}
          </Text>
          <TouchableOpacity
            style={styles.participateBtn}
            onPress={() => Linking.openURL(
              'mailto:joaofmsilva1979@gmail.com?subject=Raconte-moi%20%E2%80%94%20Retour%20utilisateur&body=Bonjour%2C%0A%0AMes%20retours%20sur%20Raconte-moi%20%3A%0A%0A'
            )}
          >
            <Text style={styles.participateBtnText}>✉️ Envoyer un retour</Text>
          </TouchableOpacity>
        </View>

        {/* Zone danger */}
        <Text style={styles.sectionTitle}>Zone danger</Text>
        <TouchableOpacity
          testID="reset-data-btn"
          style={styles.resetBtn}
          onPress={() => {
            Alert.alert(
              '⚠️ Remise à zéro complète ?',
              "Toutes tes données seront effacées : notes, ressentis, douleurs, activités, médicaments, accessoires, prénom et réglages.\n\nL'app redémarrera comme à la première ouverture.",
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Continuer →',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Dernière confirmation',
                      "Es-tu vraiment sûr(e) ? Il n'y a aucun moyen de récupérer tes données après cette action.",
                      [
                        { text: 'Non, garder mes données', style: 'cancel' },
                        {
                          text: 'Oui, tout effacer',
                          style: 'destructive',
                          onPress: async () => {
                            await resetAllData();
                            if (Platform.OS !== 'web') {
                              const FileSystem = await import('expo-file-system/legacy');
                              const photosDir = (FileSystem.documentDirectory ?? '') + 'photos/';
                              try {
                                const files = await FileSystem.readDirectoryAsync(photosDir);
                                await Promise.all(files.map(f => FileSystem.deleteAsync(photosDir + f, { idempotent: true })));
                              } catch {}
                            }
                            await loadSettings();
                            router.replace('/onboarding');
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.resetBtnText}>🗑 Remise à zéro complète</Text>
        </TouchableOpacity>

        {/* À propos */}
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.card}>
          <View testID="privacy-badge" style={styles.privacyRow}>
            <Text style={styles.privacyText}>🔒 Aucune donnée ne quitte cet iPhone</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.disclaimerText}>
            <Text style={styles.appNameSmall}>Raconte-moi</Text>
            {" n'est pas un dispositif médical et ne se substitue pas à un avis ou un suivi médical professionnel."}
          </Text>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://joaofmsilva1979.github.io/raconte-moi/privacy-policy.html')}
          >
            <Text style={styles.linkText}>Politique de confidentialité</Text>
            <Text style={styles.linkArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.versionText}>
            <Text style={{ fontStyle: 'italic' }}>Raconte-moi</Text>
            {' · v1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 24, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B8A80',
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#C09070',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 4,
    shadowColor: '#2D1A0E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D1A0E',
  },
  separator: { height: 1, marginVertical: 14 },
  genderLabel: { fontSize: 12, fontWeight: '600', color: '#9B8A80', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#F0D0B8',
    backgroundColor: '#FFF8F5',
  },
  genderIcon: { fontSize: 18, marginBottom: 2 },
  genderBtnLabel: { fontSize: 11, color: '#9B8A80' },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  swatchSelected: { borderWidth: 3, borderColor: '#2D1A0E' },
  resetBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  privacyRow: { paddingVertical: 10, alignItems: 'center' },
  privacyText: { fontSize: 13, color: '#4A7030', fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F0D0B8', marginVertical: 2 },
  disclaimerText: {
    fontSize: 12, color: '#C09070', lineHeight: 18, textAlign: 'center',
    paddingVertical: 10, paddingHorizontal: 4,
  },
  participateText: { fontSize: 14, color: '#5C3020', lineHeight: 22, marginBottom: 14 },
  appName: { fontStyle: 'italic', fontWeight: '700', color: '#5C3020' },
  appNameSmall: { fontStyle: 'italic', color: '#C09070' },
  participateBtn: {
    backgroundColor: '#FFF0E8', borderWidth: 1.5, borderColor: '#F0C0A0',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  participateBtnText: { fontSize: 14, fontWeight: '700', color: '#E85520' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkText: { fontSize: 14, color: '#E85520', fontWeight: '600' },
  linkArrow: { fontSize: 18, color: '#E85520', fontWeight: '400' },
  versionText: {
    fontSize: 11, color: '#C09070', textAlign: 'center',
    paddingVertical: 10, letterSpacing: 0.3,
  },
});
