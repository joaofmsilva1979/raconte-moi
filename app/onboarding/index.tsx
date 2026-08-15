import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { OnboardingProgress } from '@/components/OnboardingProgress';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const { saveFirstName } = useSettingsStore();

  const handleContinue = async () => {
    if (!name.trim()) return;
    await saveFirstName(name.trim());
    router.push('/onboarding/goal');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OnboardingProgress currentStep={1} totalSteps={5} />

      <View style={styles.content}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Raconte-moi</Text>
        <Text style={styles.subtitle}>Raconte-moi ta journée.</Text>

        <Text style={styles.label}>Comment tu t'appelles ?</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ton prénom"
          placeholderTextColor="#C09070"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !name.trim() && styles.buttonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Bonjour →</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 12, borderRadius: 22 },
  title: {
    fontSize: 26, fontWeight: '700', color: '#2D1A0E',
    textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, color: '#C09070', textAlign: 'center',
    marginBottom: 32, lineHeight: 20,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#5C3020', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF0E8',
    borderWidth: 1.5,
    borderColor: '#F0C0A0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2D1A0E',
  },
  button: {
    backgroundColor: '#E85520',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
