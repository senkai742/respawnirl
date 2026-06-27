import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useQuests } from '@/context/QuestContext';

export default function Journal() {
  const { quests } = useQuests();

  // Collect all non-active logs across all quests, enriched with quest info
  const historyEntries = quests.flatMap(q =>
    q.logs
      .filter(log => log.status !== 'active')
      .map(log => ({
        id: log.id,
        questTitle: q.title,
        tier: q.tier,
        status: log.status as 'completed' | 'failed' | 'skip',
        metric: log.metric,
        unitType: log.unitType,
        logDate: log.logDate,
      }))
  ).sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

  const getRewardForTier = (tier: 'Easy' | 'Medium' | 'Boss') => {
    switch (tier) {
      case 'Easy': return { xp: 10, coins: 5 };
      case 'Medium': return { xp: 30, coins: 15 };
      case 'Boss': return { xp: 50, coins: 25 };
    }
  };

  const renderEntry = ({ item }: { item: typeof historyEntries[number] }) => {
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed';
    const reward = getRewardForTier(item.tier);

    return (
      <View style={[
        styles.logEntry,
        isCompleted ? styles.logSuccess : isFailed ? styles.logFailure : styles.logSkipped,
      ]}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>{item.questTitle}</Text>
          <Text style={[styles.logStatus, {
            color: isCompleted ? Colors.dark.neonGreen
                 : isFailed ? Colors.dark.neonRed
                 : Colors.dark.textSecondary,
          }]}>
            {isCompleted ? '✓ COMPLETED' : isFailed ? '✗ FAILED' : '○ SKIPPED'}
          </Text>
        </View>
        <Text style={styles.logDate}>{item.logDate}</Text>
        <Text style={[styles.tierBadge, {
          color: item.tier === 'Easy' ? Colors.dark.neonGreen
               : item.tier === 'Medium' ? Colors.dark.neonPurple
               : Colors.dark.neonRed,
        }]}>
          [{(item.tier || 'Easy').toUpperCase()}]
        </Text>
        {isCompleted && (
          <Text style={styles.rewardText}>
            Gained {reward.xp} XP, {reward.coins} Coins
          </Text>
        )}
        {isFailed && (
          <Text style={styles.damageText}>Took damage. Streak lost.</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Adventure Log</Text>
        <Text style={styles.subtext}>Your history of triumphs and failures.</Text>

        <FlatList
          data={historyEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderEntry}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No quests recorded yet. Go make some history.</Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    color: Colors.dark.neonPurple,
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: Colors.dark.neonPurple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  subtext: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  logEntry: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: Colors.dark.backgroundElement,
  },
  logSuccess: {
    borderColor: Colors.dark.neonGreen,
  },
  logFailure: {
    borderColor: Colors.dark.neonRed,
  },
  logSkipped: {
    borderColor: Colors.dark.textSecondary,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logDate: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  rewardText: {
    color: Colors.dark.neonCyan,
    fontSize: 14,
  },
  damageText: {
    color: Colors.dark.neonRed,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },

});
