import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { COLOR_PALETTES } from '@/constants/colors';

export default function ColorScreen() {
  const { settings, savePrimaryColor } = useSettingsStore();
  const theme = useColorTheme();
  const [selected, setSelected] = useState(settings?.primary_color ?? '#E85520');
  const selectedPalette = COLOR_PALETTES.find(p => p.primary === selected) ?? COLOR_PALETTES[0];

  const handleContinue = async () => {
    await savePrimaryColor(selected);
    router.push('/onboarding/permissions');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={4} totalSteps={5} />

      <View style={styles.content}>
        <Text style={styles.title}>Ta couleur</Text>
        <Text style={styles.subtitle}>L'app s'adapte à toi.</Text>

        <View style={styles.grid}>
          {COLOR_PALETTES.map(palette => (
            <TouchableOpacity
              key={palette.primary}
              testID="color-swatch"
              onPress={() => setSelected(palette.primary)}
              style={[
                styles.swatch,
                { backgroundColor: palette.primary },
                selected === palette.primary && styles.swatchSelected,
              ]}
              activeOpacity={0.85}
            />
          ))}
        </View>

        <View style={[styles.preview, { backgroundColor: selectedPalette.background }]}>
          <View style={[styles.previewMic, { backgroundColor: selectedPalette.primary }]}>
            <Text style={styles.previewMicIcon}>🎙</Text>
          </View>
          <Text style={[styles.previewLabel, { color: selectedPalette.primary }]}>
            Aperçu — {selectedPalette.name}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: selected }]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>J'adore →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#C09070', marginBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  swatchSelected: { borderWidth: 3, borderColor: '#2D1A0E' },
  preview: { borderRadius: 16, padding: 20, alignItems: 'center' },
  previewMic: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  previewMicIcon: { fontSize: 24 },
  previewLabel: { fontSize: 13, fontWeight: '600' },
  button: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
