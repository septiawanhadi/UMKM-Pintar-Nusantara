import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function BackgroundGlows() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' } as any]}>
      <View style={[styles.blob, styles.blobOrange]} />
      <View style={[styles.blob, styles.blobTeal]} />
      <View style={[styles.blob, styles.blobPurple]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobOrange: {
    top: -80,
    right: -50,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  blobTeal: {
    top: height * 0.35,
    left: -120,
    width: 380,
    height: 380,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
  blobPurple: {
    bottom: -60,
    right: -40,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(147, 51, 234, 0.04)',
  },
});
