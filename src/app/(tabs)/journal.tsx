import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useQuests } from '@/context/QuestContext';

export default function Journal() {
  const { quests } = useQuests();
  const pastQuests = quests.filter((q) => q.completed || q.failed);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Adventure Log</Text>
        <Text style={styles.subtext}>Your history of triumphs and failures.</Text>

        <FlatList
          data={pastQuests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.logEntry, item.completed ? styles.logSuccess : styles.logFailure]}>
              <View style={styles.logHeader}>
                <Text style={styles.logTitle}>{item.title}</Text>
                <Text style={[styles.logStatus, { color: item.completed ? Colors.dark.neonCyan : Colors.dark.neonRed }]}>
                  {item.completed ? 'COMPLETED' : 'FAILED'}
                </Text>
              </View>
              {item.completed ? (
                <Text style={styles.rewardText}>Gained {item.xpReward} XP, {item.coinReward} Coins</Text>
              ) : (
                <Text style={styles.damageText}>Took damage. Streak lost.</Text>
              )}
            </View>
          )}
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
    borderColor: Colors.dark.neonCyan,
  },
  logFailure: {
    borderColor: Colors.dark.neonRed,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
