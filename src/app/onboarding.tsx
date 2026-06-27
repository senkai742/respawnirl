import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { NeonButton } from '@/components/NeonButton';

const pages = [
  {
    title: 'Welcome, Player.',
    description: 'This isn’t a game you play… it’s a life you control.',
    buttonText: 'CONTINUE',
  },
  {
    title: 'What if your life was actually a game?',
    description:
      'You are the main character, placed here with missions only you can complete.\nQuests everywhere… challenges around every corner.\n\nAnd yet… are you really playing your role, or just idling on the loading screen?',
    buttonText: "I'M READY",
  },
  {
    title: 'This is your discipline dojo.',
    description:
      'Every quest, every choice, every failure… it’s all on you.\nStep in, or remain a spectator forever.',
    buttonText: 'ENTER CONTROL CENTER',
  },
];

export default function Onboarding() {
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      fadeAnim.setValue(0);
      setCurrentPage((prev) => prev + 1);
    } else {
      router.replace('/auth');
    }
  };

  const page = pages[currentPage];

  return (
    <View style={styles.container}>
      <View style={styles.gridOverlay} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <NeonButton
          title={page.buttonText}
          onPress={handleNext}
          color={currentPage === 2 ? Colors.dark.neonRed : Colors.dark.neonCyan}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'space-between',
    padding: 32,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    // A placeholder for a cool grid/glitch background
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.dark.neonCyan,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: Colors.dark.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
});
