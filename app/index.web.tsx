// Diagnostic web — remplace le home screen complet par un écran minimaliste
// pour confirmer que le rendu React fonctionne sur GitHub Pages.
// Si cet écran s'affiche, le problème est dans un composant du vrai home screen.
import { View, Text, StyleSheet } from 'react-native';

export default function HomeWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🥕 Raconte-moi</Text>
      <Text style={styles.subtitle}>Version web — chargement en cours…</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E85520',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
