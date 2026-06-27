import { LevelUpModal } from '@/components/LevelUpModal';
import { NeonButton } from '@/components/NeonButton';
import { QuestCard } from '@/components/QuestCard';
import { RoastModal } from '@/components/RoastModal';
import { StatBar } from '@/components/StatBar';
import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/PlayerContext';
import { useQuests } from '@/context/QuestContext';
import { getTitleForQuests } from '@/utils/title';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Dashboard() {
  const { state: playerState, leveledUp, clearLevelUp, updateTitle } = usePlayer();
  const { quests, completeQuest, failQuest, resetQuest, addQuest } = useQuests();

  // Update title whenever quests change
  useEffect(() => {
    const newTitle = getTitleForQuests(quests);
    if (newTitle !== playerState.title) {
      updateTitle(newTitle);
    }
  }, [quests, playerState.title, updateTitle]);
  const [roastVisible, setRoastVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'boss'>('easy');

  const today = new Date().toISOString().split('T')[0];
  const activeQuests = quests.filter((q) => !q.logs.find(l => l.logDate === today));
  const archivedQuests = quests.filter((q) => q.logs.find(l => l.logDate === today));

  const handleFail = (id: string) => {
    failQuest(id);
    setRoastVisible(true);
  };

  const handleAddQuest = () => {
    if (!title.trim()) return;
    
    addQuest({
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
    });
    
    setTitle('');
    setDescription('');
    setDifficulty('easy');
    setModalVisible(false);
  };

  const handleOpenAddModal = () => {
    setTitle('');
    setDescription('');
    setDifficulty('easy');
    setModalVisible(true);
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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Active Quests Section */}
          <View style={styles.questsSection}>
            <Text style={styles.sectionTitle}>Active Quests</Text>
            {activeQuests.length === 0 ? (
              <Text style={styles.emptyText}>No active quests. Add one to begin!</Text>
            ) : (
              activeQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={completeQuest}
                  onFail={handleFail}
                  onReset={resetQuest}
                />
              ))
            )}
          </View>

          {/* Archived Quests Section */}
          {archivedQuests.length > 0 && (
            <View style={styles.archivedSection}>
              <Text style={[styles.sectionTitle, styles.archivedSectionTitle]}>Completed Archive</Text>
              {archivedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={completeQuest}
                  onFail={handleFail}
                  onReset={resetQuest}
                />
              ))}
            </View>
          )}
          <View style={styles.spacer} />
        </ScrollView>

        {/* FAB */}
        <View style={styles.fabContainer}>
          <NeonButton
            title="+ ADD QUEST"
            onPress={handleOpenAddModal}
            color={Colors.dark.neonPurple}
          />
        </View>

        <LevelUpModal 
          visible={leveledUp} 
          level={playerState.level} 
          onClose={clearLevelUp} 
        />
        <RoastModal visible={roastVisible} onClose={() => setRoastVisible(false)} />

        {/* Add Quest Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>NEW QUEST</Text>
              
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Quest Objective"
                placeholderTextColor={Colors.dark.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Additional details..."
                placeholderTextColor={Colors.dark.textSecondary}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                <Pressable
                  style={[styles.diffButton, difficulty === 'easy' && { borderColor: Colors.dark.neonGreen, backgroundColor: Colors.dark.neonGreen + '20' }]}
                  onPress={() => setDifficulty('easy')}
                >
                  <Text style={[styles.diffText, difficulty === 'easy' && { color: Colors.dark.neonGreen }]}>EASY</Text>
                </Pressable>
                <Pressable
                  style={[styles.diffButton, difficulty === 'medium' && { borderColor: Colors.dark.neonCyan, backgroundColor: Colors.dark.neonCyan + '20' }]}
                  onPress={() => setDifficulty('medium')}
                >
                  <Text style={[styles.diffText, difficulty === 'medium' && { color: Colors.dark.neonCyan }]}>MEDIUM</Text>
                </Pressable>
                <Pressable
                  style={[styles.diffButton, difficulty === 'boss' && { borderColor: Colors.dark.neonRed, backgroundColor: Colors.dark.neonRed + '20' }]}
                  onPress={() => setDifficulty('boss')}
                >
                  <Text style={[styles.diffText, difficulty === 'boss' && { color: Colors.dark.neonRed }]}>BOSS</Text>
                </Pressable>
              </View>

              <View style={styles.modalActions}>
                <NeonButton
                  title="CANCEL"
                  onPress={() => setModalVisible(false)}
                  color={Colors.dark.textSecondary}
                  style={styles.modalButton}
                />
                <NeonButton
                  title="CREATE"
                  onPress={handleAddQuest}
                  color={Colors.dark.neonPurple}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  scrollView: {
    flex: 1,
  },
  questsSection: {
    marginBottom: 16,
  },
  archivedSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  archivedSectionTitle: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
  },
  spacer: {
    height: 100, // Make room for FAB
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    borderTopWidth: 2,
    borderColor: Colors.dark.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalHeader: {
    color: Colors.dark.neonPurple,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  diffButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  diffText: {
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
  },
});
