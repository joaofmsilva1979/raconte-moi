import { View, StyleSheet } from 'react-native';
import { useColorTheme } from '@/hooks/useColorTheme';

interface Props {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: Props) {
  const { primary } = useColorTheme();
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { backgroundColor: i < currentStep ? primary : '#F0D0B8' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  bar: { width: 24, height: 3, borderRadius: 2 },
});
