import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getAppSettings } from '@/db/settingsRepository';

export default function IndexScreen() {
  useEffect(() => {
    getAppSettings().then(settings => {
      if (!settings.onboarding_done) {
        router.replace('/onboarding');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E85520" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F5',
  },
});
