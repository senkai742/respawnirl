import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/theme';
import { NeonButton } from './NeonButton';

interface RoastModalProps {
  visible: boolean;
  onClose: () => void;
}

const roasts = [
  'Tutorial NPC strikes again...',
  'Procrastination King: reigning supreme.',
  'Did you even try?',
  'Level 1 behavior right here.',
  'Maybe you should stick to spectator mode.',
];

export const RoastModal = ({ visible, onClose }: RoastModalProps) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const roast = roasts[Math.floor(Math.random() * roasts.length)];

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.title}>QUEST FAILED</Text>
          <Text style={styles.roast}>{roast}</Text>
          <Text style={styles.damageText}>- HP Deducted</Text>
          
          <NeonButton
            title="I'll do better"
            onPress={onClose}
            color={Colors.dark.neonRed}
            style={styles.button}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.neonRed,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.dark.neonRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: Colors.dark.neonRed,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textShadowColor: Colors.dark.neonRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  roast: {
    color: Colors.dark.text,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  damageText: {
    color: Colors.dark.textSecondary,
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
});
