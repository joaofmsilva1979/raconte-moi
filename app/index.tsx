import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🥔 Les notes de patate</Text>
      <Text style={styles.sub}>Foundation OK — Plan 02 : Onboarding</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F5' },
  text: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  sub: { fontSize: 13, color: '#C09070' },
});
