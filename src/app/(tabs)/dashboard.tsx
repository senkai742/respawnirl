import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/PlayerContext';
import { useQuests } from '@/context/QuestContext';
import { StatBar } from '@/components/StatBar';
import { QuestCard } from '@/components/QuestCard';
import { RoastModal } from '@/components/RoastModal';

export default function Dashboard() {
  const { state: playerState } = usePlayer();
  const { quests, completeQuest, failQuest } = useQuests();
  const [roastVisible, setRoastVisible] = useState(false);

  const activeQuests = quests.filter((q) => !q.completed && !q.failed);

  const handleFail = (id: string) => {
    failQuest(id);
    setRoastVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HUD Section */}
        <View style={styles.hud}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.titleText}>{playerState.title}</Text>
              <Text style={styles.levelText}>Level {playerState.level}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statChip}>🪙 {playerState.coins}</Text>
              <Text style={styles.statChip}>🔥 {playerState.streak}</Text>
            </View>
          </View>

          <StatBar
            label="HP (Discipline)"
            current={playerState.hp}
            max={playerState.maxHp}
            color={Colors.dark.neonRed}
          />
          <StatBar
            label="XP"
            current={playerState.xp}
            max={playerState.maxXp}
            color={Colors.dark.neonCyan}
          />
        </View>

        {/* Quests Section */}
        <View style={styles.questsSection}>
          <Text style={styles.sectionTitle}>Active Quests</Text>
          <FlatList
            data={activeQuests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <QuestCard
                quest={item}
                onComplete={completeQuest}
                onFail={handleFail}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <RoastModal visible={roastVisible} onClose={() => setRoastVisible(false)} />
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
  hud: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
    shadowColor: Colors.dark.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleText: {
    color: Colors.dark.neonCyan,
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: Colors.dark.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  levelText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    backgroundColor: Colors.dark.backgroundSelected,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: Colors.dark.text,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  questsSection: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
});
