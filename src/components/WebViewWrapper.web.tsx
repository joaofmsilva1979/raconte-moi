import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web stub — react-native-webview n'existe pas sur web
export default function WebViewWrapper() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📄</Text>
      <Text style={styles.text}>Visualisation PDF disponible uniquement sur l'app iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  icon: { fontSize: 48 },
  text: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
