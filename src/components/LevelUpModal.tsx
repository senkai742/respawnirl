import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export const LevelUpModal = ({ visible, level, onClose }: LevelUpModalProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.levelUpText}>LEVEL UP!</Text>
          <Text style={styles.levelText}>LEVEL {level}</Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.dark.neonCyan,
    alignItems: 'center',
    shadowColor: Colors.dark.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  levelUpText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.neonCyan,
    marginBottom: 10,
    textShadowColor: Colors.dark.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  levelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: Colors.dark.neonPurple,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  closeButtonText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
