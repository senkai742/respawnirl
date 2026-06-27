import { NeonButton } from '@/components/NeonButton';
import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/PlayerContext';
import { useQuests } from '@/context/QuestContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function QuestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { quests, logQuest, resetQuestLog, updateQuest } = useQuests();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'boss'>('easy');

  const quest = quests.find(q => q.id === id);

  if (!quest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Quest not found</Text>
          <NeonButton title="Go back" onPress={() => router.back()} color={Colors.dark.neonPurple} />
        </View>
      </SafeAreaView>
    );
  }

  // Prepare marked dates for calendar
  const markedDates: Record<string, any> = {
    [selectedDate]: { selected: true, selectedColor: Colors.dark.neonPurple },
  };

  quest.logs.forEach(log => {
    markedDates[log.logDate] = {
      ...markedDates[log.logDate],
      dotColor: log.status === 'completed' ? Colors.dark.neonGreen : Colors.dark.neonRed,
      selectedDotColor: Colors.dark.neonPurple,
    };
  });

  const getCurrentLogForDate = (date: string) => quest.logs.find(l => l.logDate === date);

  const currentLog = getCurrentLogForDate(selectedDate);

  const handleEdit = () => {
    setEditTitle(quest.title);
    setEditDescription(quest.description || '');
    setEditDifficulty(quest.difficulty);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    updateQuest(quest.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      difficulty: editDifficulty,
    });
    setEditModalVisible(false);
  };

  const getDifficultyColor = () => {
    switch (quest.difficulty) {
      case 'easy': return Colors.dark.neonGreen;
      case 'medium': return Colors.dark.neonCyan;
      case 'boss': return Colors.dark.neonRed;
      default: return Colors.dark.text;
    }
  };

  const difficultyLabel = quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <Pressable onPress={handleEdit}>
            <Text style={styles.editButton}>Edit</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.questInfo}>
            <Text style={styles.title}>{quest.title}</Text>
            {quest.description && (
              <Text style={styles.description}>{quest.description}</Text>
            )}
            <View style={styles.metadataRow}>
              <Text style={[styles.difficultyLabel, { color: getDifficultyColor() }]}>
                {difficultyLabel}
              </Text>
              <Text style={styles.rewardLabel}>+{quest.xpReward} XP · +{quest.coinReward} 🪙</Text>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <Text style={styles.sectionTitle}>Daily Log</Text>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                backgroundColor: Colors.dark.background,
                calendarBackground: Colors.dark.backgroundElement,
                textSectionTitleColor: Colors.dark.textSecondary,
                selectedDayBackgroundColor: Colors.dark.neonPurple,
                selectedDayTextColor: Colors.dark.text,
                todayTextColor: Colors.dark.neonCyan,
                dayTextColor: Colors.dark.text,
                textDisabledColor: Colors.dark.border,
                arrowColor: Colors.dark.neonPurple,
                monthTextColor: Colors.dark.text,
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.logActions}>
            <Text style={styles.sectionTitle}>
              {selectedDate} Status:
            </Text>
            {currentLog ? (
              <View style={styles.statusRow}>
                <Text style={[
                  styles.currentStatus,
                  { color: currentLog.status === 'completed' ? Colors.dark.neonGreen : Colors.dark.neonRed }
                ]}>
                  {currentLog.status.charAt(0).toUpperCase() + currentLog.status.slice(1)}
                </Text>
                <View style={styles.actionButtons}>
                  <NeonButton
                    title="Reset"
                    onPress={() => resetQuestLog(quest.id, selectedDate)}
                    color={Colors.dark.textSecondary}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.noStatus}>No log yet</Text>
            )}

            {!currentLog && (
              <View style={styles.newLogButtons}>
                <NeonButton
                  title="Mark Complete"
                  onPress={() => logQuest(quest.id, selectedDate, 'completed')}
                  color={Colors.dark.neonGreen}
                  style={styles.actionButton}
                />
                <NeonButton
                  title="Mark Failed"
                  onPress={() => logQuest(quest.id, selectedDate, 'failed')}
                  color={Colors.dark.neonRed}
                  style={styles.actionButton}
                />
              </View>
            )}
          </View>

          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            {quest.logs
              .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
              .map(log => (
                <View key={log.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>{log.logDate}</Text>
                  <Text style={[
                    styles.historyStatus,
                    { color: log.status === 'completed' ? Colors.dark.neonGreen : Colors.dark.neonRed }
                  ]}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </Text>
                </View>
              ))}
          </View>
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>Edit Quest</Text>
              
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Quest title"
                placeholderTextColor={Colors.dark.textSecondary}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor={Colors.dark.textSecondary}
                value={editDescription}
                onChangeText={setEditDescription}
              />

              <Text style={styles.inputLabel}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                <Pressable
                  style={[styles.diffButton, editDifficulty === 'easy' && { borderColor: Colors.dark.neonGreen, backgroundColor: Colors.dark.neonGreen + '20' }]}
                  onPress={() => setEditDifficulty('easy')}
                >
                  <Text style={[styles.diffText, editDifficulty === 'easy' && { color: Colors.dark.neonGreen }]}>EASY</Text>
                </Pressable>
                <Pressable
                  style={[styles.diffButton, editDifficulty === 'medium' && { borderColor: Colors.dark.neonCyan, backgroundColor: Colors.dark.neonCyan + '20' }]}
                  onPress={() => setEditDifficulty('medium')}
                >
                  <Text style={[styles.diffText, editDifficulty === 'medium' && { color: Colors.dark.neonCyan }]}>MEDIUM</Text>
                </Pressable>
                <Pressable
                  style={[styles.diffButton, editDifficulty === 'boss' && { borderColor: Colors.dark.neonRed, backgroundColor: Colors.dark.neonRed + '20' }]}
                  onPress={() => setEditDifficulty('boss')}
                >
                  <Text style={[styles.diffText, editDifficulty === 'boss' && { color: Colors.dark.neonRed }]}>BOSS</Text>
                </Pressable>
              </View>

              <View style={styles.modalActions}>
                <NeonButton
                  title="Cancel"
                  onPress={() => setEditModalVisible(false)}
                  color={Colors.dark.textSecondary}
                  style={styles.modalButton}
                />
                <NeonButton
                  title="Save"
                  onPress={handleSaveEdit}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    color: Colors.dark.neonPurple,
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    color: Colors.dark.neonCyan,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  questInfo: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rewardLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  calendarContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  logActions: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noStatus: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  newLogButtons: {
    marginTop: 16,
    gap: 12,
  },
  historyContainer: {
    paddingBottom: 100,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyDate: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  modalButton: {
    flex: 1,
  },
});
