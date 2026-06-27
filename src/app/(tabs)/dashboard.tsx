import { LevelUpModal } from '@/components/LevelUpModal';
import { NeonButton } from '@/components/NeonButton';
import QuestCard from '@/components/QuestCard';
import { RoastModal } from '@/components/RoastModal';
import { StatBar } from '@/components/StatBar';
import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/PlayerContext';
import { QuestUnit, useQuests } from '@/context/QuestContext';
import { getTitleForQuests } from '@/utils/title';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Dashboard() {
  const { state: playerState, leveledUp, clearLevelUp, updateTitle } = usePlayer();
  const { quests, addQuest, resetTodayLog, getTodayLog } = useQuests();

  // Update title whenever quests change
  useEffect(() => {
    const newTitle = getTitleForQuests(quests);
    if (newTitle !== playerState.title) {
      updateTitle(newTitle);
    }
  }, [quests, playerState.title, updateTitle]);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<'Easy' | 'Medium' | 'Boss'>('Easy');
  const [unitType, setUnitType] = useState<QuestUnit>('binary');
  const [defaultTarget, setDefaultTarget] = useState('1');
  const [defaultOperator, setDefaultOperator] = useState<'<' | '<=' | '=' | '>=' | '>'>('>=');

  const today = new Date().toISOString().split('T')[0];
  const activeQuests = quests.filter((q) => {
    const log = getTodayLog(q.id);
    return !log || log.status === 'active';
  });
  const archivedQuests = quests.filter((q) => {
    const log = getTodayLog(q.id);
    return log && log.status !== 'active';
  });

  const handleAddQuest = () => {
    if (!title.trim()) return;
    
    addQuest({
      title: title.trim(),
      description: description.trim() || undefined,
      tier,
      defaultUnitType: unitType,
      defaultTarget: parseInt(defaultTarget) || 1,
      defaultOperator: defaultOperator as '>=' | '<=',
    });
    
    setTitle('');
    setDescription('');
    setTier('Easy');
    setUnitType('binary');
    setDefaultTarget('1');
    setDefaultOperator('>=');
    setModalVisible(false);
  };

  const handleOpenAddModal = () => {
    setTitle('');
    setDescription('');
    setTier('Easy');
    setUnitType('binary');
    setDefaultTarget('1');
    setDefaultOperator('>=');
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
        <RoastModal visible={false} onClose={() => {}} />

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

              <Text style={styles.inputLabel}>Tier</Text>
              <View style={styles.optionRow}>
                {['Easy', 'Medium', 'Boss'].map((t) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.optionButton, 
                      tier === t && { 
                        borderColor: t === 'Easy' ? Colors.dark.neonGreen : t === 'Medium' ? Colors.dark.neonPurple : Colors.dark.neonRed, 
                        backgroundColor: (t === 'Easy' ? Colors.dark.neonGreen : t === 'Medium' ? Colors.dark.neonPurple : Colors.dark.neonRed) + '20' 
                      }]}
                    onPress={() => setTier(t as any)}
                  >
                    <Text style={[
                      styles.optionText, 
                      tier === t && { 
                        color: t === 'Easy' ? Colors.dark.neonGreen : t === 'Medium' ? Colors.dark.neonPurple : Colors.dark.neonRed 
                      }
                    ]}>{t.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.optionRow}>
                {[
                  { value: 'binary', label: 'Binary' },
                  { value: 'count', label: 'Count' },
                  { value: 'time_min', label: 'Time (s)' },
                  { value: 'time_hr', label: 'Time (m)' },
                  { value: 'clock_time', label: 'Clock' },
                ].map((u) => (
                  <Pressable
                    key={u.value}
                    style={[
                      styles.optionButton, 
                      unitType === u.value && { 
                        borderColor: Colors.dark.neonCyan, 
                        backgroundColor: Colors.dark.neonCyan + '20' 
                      }]}
                    onPress={() => setUnitType(u.value as any)}
                  >
                    <Text style={[
                      styles.optionText, 
                      unitType === u.value && { 
                        color: Colors.dark.neonCyan 
                      }
                    ]}>{u.label}</Text>
                  </Pressable>
                ))}
              </View>

              {(unitType !== 'binary') && (
                <>
                  <Text style={styles.inputLabel}>Target</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={defaultTarget}
                    onChangeText={setDefaultTarget}
                  />

                  <Text style={styles.inputLabel}>Condition</Text>
                  <View style={styles.optionRow}>
                    {['>=', '<='].map((o) => (
                      <Pressable
                        key={o}
                        style={[
                          styles.optionButton, 
                          defaultOperator === o && { 
                            borderColor: Colors.dark.neonPurple, 
                            backgroundColor: Colors.dark.neonPurple + '20' 
                          }]}
                        onPress={() => setDefaultOperator(o as any)}
                      >
                        <Text style={[
                          styles.optionText, 
                          defaultOperator === o && { 
                            color: Colors.dark.neonPurple 
                          }
                        ]}>{o}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

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
    height: 100,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 16,
    marginTop: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.dark.backgroundElement,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: Colors.dark.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    color: Colors.dark.neonPurple,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: Colors.dark.neonPurple,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  inputLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionText: {
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
});
