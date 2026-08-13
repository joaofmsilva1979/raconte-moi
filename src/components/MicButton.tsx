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
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
  },
  haloInner: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  button: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: {
    fontSize: 38,
  },
});
