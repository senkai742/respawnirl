import { NeonButton } from '@/components/NeonButton';
import { Colors } from '@/constants/theme';
import { QuestUnit, useQuests } from '@/context/QuestContext';
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
  const { quests, logQuest, resetLog, updateQuest } = useQuests();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTier, setEditTier] = useState<'Easy' | 'Medium' | 'Boss'>('Easy');
  const [editUnitType, setEditUnitType] = useState<QuestUnit>('binary');
  const [editDefaultTarget, setEditDefaultTarget] = useState('1');
  const [editDefaultOperator, setEditDefaultOperator] = useState<'<' | '<=' | '=' | '>=' | '>'>('>=');

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
    let bgColor: string;
    let textColor: string;

    switch (log.status) {
      case 'completed':
        bgColor = `${Colors.dark.neonGreen}40`;
        textColor = Colors.dark.neonGreen;
        break;
      case 'failed':
        bgColor = `${Colors.dark.neonRed}40`;
        textColor = Colors.dark.neonRed;
        break;
      case 'skip':
        bgColor = `${Colors.dark.textSecondary}40`;
        textColor = Colors.dark.textSecondary;
        break;
      case 'active':
        bgColor = Colors.dark.background;
        textColor = Colors.dark.text;
        break;
    }

    markedDates[log.logDate] = {
      ...markedDates[log.logDate],
      customStyles: {
        container: {
          backgroundColor: bgColor,
          borderRadius: 50,
        },
        text: {
          color: textColor,
        },
      },
    };
  });

  const getCurrentLogForDate = (date: string) => quest.logs.find(l => l.logDate === date);

  const currentLog = getCurrentLogForDate(selectedDate);

  const handleEdit = () => {
    setEditTitle(quest.title);
    setEditDescription(quest.description || '');
    setEditTier(quest.tier);
    setEditUnitType(quest.defaultUnitType);
    setEditDefaultTarget(String(quest.defaultTarget));
    setEditDefaultOperator(quest.defaultOperator as any);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    updateQuest(quest.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      tier: editTier,
      defaultUnitType: editUnitType,
      defaultTarget: parseInt(editDefaultTarget) || 1,
      defaultOperator: editDefaultOperator as '>=' | '<=',
    });
    setEditModalVisible(false);
  };

  const getTierColor = () => {
    switch (quest.tier) {
      case 'Easy': return Colors.dark.neonGreen;
      case 'Medium': return Colors.dark.neonPurple;
      case 'Boss': return Colors.dark.neonRed;
      default: return Colors.dark.text;
    }
  };

  const getReward = () => {
    switch (quest.tier) {
      case 'Easy': return { xp: 10, coins: 5 };
      case 'Medium': return { xp: 30, coins: 15 };
      case 'Boss': return { xp: 50, coins: 25 };
    }
  };

  const reward = getReward();

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
              <Text style={[styles.tierLabel, { color: getTierColor() }]}>
                {quest.tier}
              </Text>
              <Text style={styles.rewardLabel}>+{reward.xp} XP · +{reward.coins} 🪙</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>Type: {quest.defaultUnitType}</Text>
              <Text style={styles.targetLabel}>Target: {quest.defaultTarget} ({quest.defaultOperator})</Text>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <Text style={styles.sectionTitle}>Daily Log</Text>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              markingType="custom"
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
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: `${Colors.dark.neonGreen}40` }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: `${Colors.dark.neonRed}40` }]} />
                <Text style={styles.legendText}>Failed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: `${Colors.dark.textSecondary}40` }]} />
                <Text style={styles.legendText}>Skipped</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.dark.border }]} />
                <Text style={styles.legendText}>No Log</Text>
              </View>
            </View>
          </View>

          <View style={styles.logActions}>
            <Text style={styles.sectionTitle}>
              {selectedDate} Status:
            </Text>
            {currentLog ? (
              <View style={styles.statusRow}>
                <Text style={[
                  styles.currentStatus,
                  { 
                    color: 
                      currentLog.status === 'completed' ? Colors.dark.neonGreen : 
                      currentLog.status === 'failed' ? Colors.dark.neonRed : 
                      currentLog.status === 'skip' ? Colors.dark.textSecondary :
                      Colors.dark.text
                  }
                ]}>
                  {currentLog.status.charAt(0).toUpperCase() + currentLog.status.slice(1)}
                </Text>
                <View style={styles.actionButtons}>
                  <NeonButton
                    title="Reset"
                    onPress={() => resetLog(quest.id, selectedDate)}
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
                <NeonButton
                  title="Skip"
                  onPress={() => logQuest(quest.id, selectedDate, 'skip')}
                  color={Colors.dark.textSecondary}
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
                    { 
                      color: log.status === 'completed' ? Colors.dark.neonGreen : 
                             log.status === 'failed' ? Colors.dark.neonRed : 
                             Colors.dark.textSecondary 
                    }
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

              <Text style={styles.inputLabel}>Tier</Text>
              <View style={styles.optionRow}>
                {['Easy', 'Medium', 'Boss'].map((t) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.optionButton, 
                      editTier === t && { 
                        borderColor: t === 'Easy' ? Colors.dark.neonGreen : t === 'Medium' ? Colors.dark.neonPurple : Colors.dark.neonRed, 
                        backgroundColor: (t === 'Easy' ? Colors.dark.neonGreen : t === 'Medium' ? Colors.dark.neonPurple : Colors.dark.neonRed) + '20' 
                      }]}
                    onPress={() => setEditTier(t as any)}
                  >
                    <Text style={[
                      styles.optionText, 
                      editTier === t && { 
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
                      editUnitType === u.value && { 
                        borderColor: Colors.dark.neonCyan, 
                        backgroundColor: Colors.dark.neonCyan + '20' 
                      }]}
                    onPress={() => setEditUnitType(u.value as any)}
                  >
                    <Text style={[
                      styles.optionText, 
                      editUnitType === u.value && { 
                        color: Colors.dark.neonCyan 
                      }
                    ]}>{u.label}</Text>
                  </Pressable>
                ))}
              </View>

              {(editUnitType !== 'binary') && (
                <>
                  <Text style={styles.inputLabel}>Target</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={editDefaultTarget}
                    onChangeText={setEditDefaultTarget}
                  />

                  <Text style={styles.inputLabel}>Condition</Text>
                  <View style={styles.optionRow}>
                    {['>=', '<='].map((o) => (
                      <Pressable
                        key={o}
                        style={[
                          styles.optionButton, 
                          editDefaultOperator === o && { 
                            borderColor: Colors.dark.neonPurple, 
                            backgroundColor: Colors.dark.neonPurple + '20' 
                          }]}
                        onPress={() => setEditDefaultOperator(o as any)}
                      >
                        <Text style={[
                          styles.optionText, 
                          editDefaultOperator === o && { 
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
    marginBottom: 8,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rewardLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  targetLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  legendText: {
    color: Colors.dark.text,
    fontSize: 14,
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
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
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
