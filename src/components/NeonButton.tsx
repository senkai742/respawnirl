import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  disabled?: boolean;
}

export const NeonButton = ({ title, onPress, style, textStyle, color = Colors.dark.neonCyan, disabled = false }: NeonButtonProps) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { borderColor: color },
          pressed && !disabled && { backgroundColor: `${color}20` },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Text style={[styles.text, { color, textShadowColor: color }, textStyle]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: Colors.dark.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
