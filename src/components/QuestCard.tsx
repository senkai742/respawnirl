import { Colors } from '@/constants/theme';
import { Quest } from '@/context/QuestContext';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { NeonButton } from './NeonButton';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
  onFail: (id: string) => void;
  onReset: (id: string) => void;
}

export const QuestCard = ({ quest, onComplete, onFail, onReset }: QuestCardProps) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const today = new Date().toISOString().split('T')[0];
  const todayLog = quest.logs.find(l => l.logDate === today);

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

  const handlePress = () => {
    router.push(`/quest/${quest.id}`);
  };

  const difficultyColor =
    quest.difficulty === 'easy'
      ? Colors.dark.neonGreen
      : quest.difficulty === 'medium'
      ? Colors.dark.neonCyan
      : Colors.dark.neonRed;

  if (todayLog) {
    return (
      <Pressable onPress={handlePress}>
        <View style={[styles.card, styles.archivedCard]}>
          <View style={styles.header}>
            <Text style={[
              styles.title, 
              styles.archivedTitle,
              { 
                textDecorationColor: todayLog.status === 'failed' ? Colors.dark.neonRed : Colors.dark.textSecondary,
                color: todayLog.status === 'failed' ? Colors.dark.neonRed : Colors.dark.textSecondary,
              }
            ]}>
              {quest.title}
            </Text>
            <Text style={[styles.statusBadge, { backgroundColor: todayLog.status === 'completed' ? Colors.dark.neonGreen + '30' : Colors.dark.neonRed + '30' }]}>
              <Text style={[styles.statusText, { color: todayLog.status === 'completed' ? Colors.dark.neonGreen : Colors.dark.neonRed }]}>
                {todayLog.status === 'completed' ? '✓ COMPLETED' : '✗ FAILED'}
              </Text>
            </Text>
            <Text style={[styles.difficulty, { color: difficultyColor }]}>
              [{quest.difficulty.toUpperCase()}]
            </Text>
          </View>
          {!!quest.description && (
            <Text style={[styles.description, styles.archivedDescription]}>{quest.description}</Text>
          )}

          <View style={styles.rewards}>
            <Text style={styles.rewardText}>XP: {todayLog.status === 'completed' ? `+${quest.xpReward}` : '0'}</Text>
            <Text style={styles.rewardText}>Coins: {todayLog.status === 'completed' ? `+${quest.coinReward}` : '0'}</Text>
          </View>

          <View style={styles.actions}>
            <NeonButton
              title="Revert"
              onPress={() => onReset(quest.id)}
              color={Colors.dark.neonPurple}
              style={styles.actionButton}
              textStyle={{ fontSize: 14 }}
            />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{quest.title}</Text>
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
      </Animated.View>
    </Pressable>
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
  archivedCard: {
    opacity: 0.7,
    borderStyle: 'dashed',
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
  archivedTitle: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  difficulty: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  archivedDescription: {
    opacity: 0.6,
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
