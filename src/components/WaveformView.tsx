import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const HEIGHTS = [6, 14, 20, 10, 18, 22, 8, 16, 12, 20, 6, 14, 18, 10, 22, 8];

interface WaveformViewProps {
  isActive: boolean;
  primaryColor: string;
}

export function WaveformView({ isActive, primaryColor }: WaveformViewProps) {
  const animations = useRef(HEIGHTS.map((h) => new Animated.Value(h))).current;

  useEffect(() => {
    if (!isActive) {
      animations.forEach((anim, i) =>
        Animated.timing(anim, { toValue: HEIGHTS[i], useNativeDriver: false, duration: 200 }).start()
      );
      return;
    }

    const loops = animations.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: HEIGHTS[i] * (0.5 + Math.random() * 0.7),
            duration: 200 + i * 20,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: HEIGHTS[i],
            duration: 200 + i * 20,
            useNativeDriver: false,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [isActive]);

  return (
    <View style={styles.container} testID="waveform">
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, { backgroundColor: primaryColor, height: anim }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
});
