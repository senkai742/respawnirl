import { Colors } from '@/constants/theme';
import { Quest } from '@/context/QuestContext';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { NeonButton } from './NeonButton';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
  onFail: (id: string) => void;
  onEdit: (quest: Quest) => void;
}

export const QuestCard = ({ quest, onComplete, onFail, onEdit }: QuestCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const difficultyColor =
    quest.difficulty === 'easy'
      ? Colors.dark.neonGreen
      : quest.difficulty === 'medium'
      ? Colors.dark.neonCyan
      : Colors.dark.neonRed;

  if (quest.completed || quest.failed) return null;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.header}>
          <Text style={styles.title}>{quest.title}</Text>
          <Pressable onPress={() => onEdit(quest)} style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Text style={[styles.difficulty, { color: difficultyColor }]}>
            [{quest.difficulty.toUpperCase()}]
          </Text>
        </View>
        {!!quest.description && (
          <Text style={styles.description}>{quest.description}</Text>
        )}

        <View style={styles.rewards}>
          <Text style={styles.rewardText}>XP: +{quest.xpReward}</Text>
          <Text style={styles.rewardText}>Coins: +{quest.coinReward}</Text>
        </View>

        <View style={styles.actions}>
          <NeonButton
            title="Complete"
            onPress={() => onComplete(quest.id)}
            color={Colors.dark.neonCyan}
            style={styles.actionButton}
            textStyle={{ fontSize: 14 }}
          />
          <NeonButton
            title="Fail"
            onPress={() => onFail(quest.id)}
            color={Colors.dark.neonRed}
            style={styles.actionButton}
            textStyle={{ fontSize: 14 }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.dark.textSecondary,
    borderRadius: 4,
  },
  editText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  description: {
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  rewards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  rewardText: {
    color: Colors.dark.neonPurple,
    fontWeight: 'bold',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
