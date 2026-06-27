import { Colors } from '@/constants/theme';
import { Quest, QuestLog, QuestUnit, useQuests } from '@/context/QuestContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { NeonButton } from './NeonButton';

interface QuestCardProps {
  quest: Quest;
}

export default function QuestCard({ quest }: QuestCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const { getTodayLog, updateLog, resetTodayLog } = useQuests();
  const todayLog = getTodayLog(quest.id);
  const todayStr = new Date().toISOString().split('T')[0];

  // Single entry point: routes every unit control back to the context evaluator.
  const updateTodayLog = (
    questId: string,
    update: Partial<Pick<QuestLog, 'status' | 'metric'>>
  ) => updateLog(questId, todayStr, update);

  const difficultyColor = quest.tier === 'Easy'
    ? Colors[colorScheme].neonGreen
    : quest.tier === 'Medium'
      ? Colors[colorScheme].neonPurple
      : Colors[colorScheme].neonRed;

  // Timer state for time-based units
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTimerToggle = (current: number) => {
    const unitType = todayLog?.unitType || quest.defaultUnitType;
    const interval = unitType === 'time_hr' ? 60000 : 1000;

    if (isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      let count = current;
      timerRef.current = setInterval(() => {
        count++;
        updateLog(quest.id, todayStr, { metric: { ...(todayLog?.metric || { target: quest.defaultTarget, operator: quest.defaultOperator }), current: count } });
      }, interval);
    }
  };

  // Stop timer if log status changes to non-active
  useEffect(() => {
    if (todayLog?.status !== 'active' && isTimerRunning) {
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [todayLog?.status]);

  const handlePress = () => {
    router.push(`/quest/${quest.id}` as any);
  };

  if (todayLog && todayLog.status !== 'active') {
    const isCompleted = todayLog.status === 'completed';
    const isFailed = todayLog.status === 'failed';
    const isSkipped = todayLog.status === 'skip';

    return (
      <Pressable onPress={handlePress}>
        <View style={[styles.card, styles.archivedCard]}>
          <View style={styles.header}>
            <Text style={[
              styles.title,
              {
                textDecorationColor: isFailed ? Colors[colorScheme].neonRed : Colors[colorScheme].textSecondary,
                color: isFailed ? Colors[colorScheme].neonRed : Colors[colorScheme].textSecondary,
                textDecorationLine: isFailed ? 'line-through' : 'none',
              }
            ]}>
              {quest.title}
            </Text>
            <Text style={[
              styles.statusBadge,
              {
                backgroundColor:
                  isCompleted ? Colors[colorScheme].neonGreen + '30' :
                    isFailed ? Colors[colorScheme].neonRed + '30' :
                      Colors[colorScheme].textSecondary + '30'
              }
            ]}>
              <Text style={[
                styles.statusText,
                {
                  color:
                    isCompleted ? Colors[colorScheme].neonGreen :
                      isFailed ? Colors[colorScheme].neonRed :
                        Colors[colorScheme].textSecondary
                }
              ]}>
                {isCompleted ? '✓ COMPLETED' : isFailed ? '✗ FAILED' : '○ SKIPPED'}
              </Text>
            </Text>
            <Text style={[styles.difficulty, { color: difficultyColor }]}>
              [{(quest.tier || 'Easy').toUpperCase()}]
            </Text>
          </View>
          {!!quest.description && (
            <Text style={[styles.description, styles.archivedDescription]}>{quest.description}</Text>
          )}
          <View style={styles.actions}>
            <NeonButton
              title="Revert"
              onPress={() => resetTodayLog(quest.id)}
              color={Colors[colorScheme].neonPurple}
              style={styles.actionButton}
              textStyle={{ fontSize: 14 }}
            />
          </View>
        </View>
      </Pressable>
    );
  }

  // Active state
  const unitType = todayLog?.unitType || quest.defaultUnitType;
  const metric = todayLog?.metric || { current: 0, target: quest.defaultTarget, operator: quest.defaultOperator };

  return (
    <Pressable onPress={handlePress}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{quest.title}</Text>
          <Text style={[styles.difficulty, { color: difficultyColor }]}>
            [{(quest.tier || 'Easy').toUpperCase()}]
          </Text>
        </View>
        {!!quest.description && (
          <Text style={styles.description}>{quest.description}</Text>
        )}

        {/* Unit-specific controls */}
        <UnitControls
          unitType={unitType}
          metric={metric}
          onUpdate={(newMetric) => updateTodayLog(quest.id, { metric: { ...metric, ...newMetric } })}
          onTimerToggle={handleTimerToggle}
          isTimerRunning={isTimerRunning}
          onComplete={() => updateTodayLog(quest.id, { status: 'completed' })}
          onFail={() => updateTodayLog(quest.id, { status: 'failed' })}
        />
      </View>
    </Pressable>
  );
}

interface UnitControlsProps {
  unitType: QuestUnit;
  metric: { current: number; target: number; operator: '>=' | '<=' };
  onUpdate: (metric: Partial<{ current: number; target: number; operator: '>=' | '<=' }>) => void;
  onTimerToggle: (current: number) => void;
  isTimerRunning: boolean;
  onComplete: () => void;
  onFail: () => void;
}

function UnitControls({
  unitType,
  metric,
  onUpdate,
  onTimerToggle,
  isTimerRunning,
  onComplete,
  onFail
}: UnitControlsProps) {
  const colorScheme = useColorScheme() ?? 'dark';

  switch (unitType) {
    case 'binary':
      return (
        <View style={styles.actions}>
          <NeonButton
            title="COMPLETE"
            onPress={onComplete}
            color={Colors[colorScheme].neonGreen}
            style={styles.actionButton}
          />
          <NeonButton
            title="FAIL"
            onPress={onFail}
            color={Colors[colorScheme].neonRed}
            style={styles.actionButton}
          />
        </View>
      );

    case 'count':
      return (
        <View style={styles.countContainer}>
          <View style={styles.countStepper}>
            <NeonButton
              title="−"
              onPress={() => onUpdate({ current: Math.max(0, metric.current - 1) })}
              color={Colors[colorScheme].neonPurple}
              style={styles.stepButton}
            />
            <View style={styles.countDisplay}>
              <Text style={styles.countNumber}>{metric.current}</Text>
              <Text style={styles.countDivider}>/</Text>
              <Text style={styles.countNumber}>{metric.target}</Text>
            </View>
            <NeonButton
              title="+"
              onPress={() => onUpdate({ current: metric.current + 1 })}
              color={Colors[colorScheme].neonPurple}
              style={styles.stepButton}
            />
          </View>
          <View style={styles.actions}>
            <NeonButton
              title="FAIL"
              onPress={onFail}
              color={Colors[colorScheme].neonRed}
              style={styles.actionButton}
            />
          </View>
        </View>
      );

    case 'time_min':
    case 'time_hr':
      const unitLabel = unitType === 'time_hr' ? 'min' : 'sec';
      return (
        <View style={styles.timerContainer}>
          <Text style={styles.timerDisplay}>
            {metric.current} {unitLabel} / {metric.target} {unitLabel}
          </Text>
          <View style={styles.actions}>
            <NeonButton
              title={isTimerRunning ? 'PAUSE' : 'START'}
              onPress={() => onTimerToggle(metric.current)}
              color={Colors[colorScheme].neonCyan}
              style={styles.actionButton}
            />
            <NeonButton
              title="FAIL"
              onPress={onFail}
              color={Colors[colorScheme].neonRed}
              style={styles.actionButton}
            />
          </View>
        </View>
      );

    case 'clock_time':
      const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}`;
      };

      return (
        <View style={styles.clockContainer}>
          <Text style={styles.clockDisplay}>
            {metric.current > 0 ? formatTime(metric.current) : '--:--'}
          </Text>
          <View style={styles.actions}>
            <NeonButton
              title="PUNCH IN"
              onPress={() => {
                const now = new Date();
                const totalMinutes = now.getHours() * 60 + now.getMinutes();
                onUpdate({ current: totalMinutes });
              }}
              color={Colors[colorScheme].neonCyan}
              style={styles.actionButton}
            />
            <NeonButton
              title="FAIL"
              onPress={onFail}
              color={Colors[colorScheme].neonRed}
              style={styles.actionButton}
            />
          </View>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  archivedCard: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  archivedTitle: {
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  difficulty: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  archivedDescription: {
    color: Colors.dark.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  countContainer: {
    gap: 8,
    marginTop: 12,
  },
  countStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
  },
  countDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countNumber: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  countDivider: {
    color: Colors.dark.textSecondary,
    fontSize: 24,
  },
  timerContainer: {
    gap: 8,
    marginTop: 12,
  },
  timerDisplay: {
    color: Colors.dark.neonCyan,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clockContainer: {
    gap: 8,
    marginTop: 12,
  },
  clockDisplay: {
    color: Colors.dark.neonCyan,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  }
});
