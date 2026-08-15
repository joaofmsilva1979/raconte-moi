import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MicButtonProps {
  primaryColor: string;
  isRecording: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function MicButton({ primaryColor, isRecording, onPressIn, onPressOut }: MicButtonProps) {
  const activeColor = isRecording ? '#CC2200' : primaryColor;
  const rgb = hexToRgb(isRecording ? '#CC2200' : primaryColor);

  return (
    <View style={styles.wrap} testID="mic-button-wrap">
      <View style={[styles.haloOuter, { backgroundColor: `rgba(${rgb},0.08)` }]} />
      <View style={[styles.haloInner, { backgroundColor: `rgba(${rgb},0.14)` }]} />
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        testID="mic-button"
        accessibilityLabel={isRecording ? "Relâcher pour terminer l'enregistrement" : "Maintenir pour enregistrer"}
        accessibilityRole="button"
        accessibilityHint={isRecording ? undefined : "Maintiens appuyé et parle"}
        style={[styles.button, { backgroundColor: activeColor, shadowColor: activeColor }]}
      >
        <Text style={styles.icon}>{isRecording ? '⏹' : '🎙'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '232,85,32';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

const styles = StyleSheet.create({
  wrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
  },
  haloInner: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  icon: {
    fontSize: 46,
  },
});
