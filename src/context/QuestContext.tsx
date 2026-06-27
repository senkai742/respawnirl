import { supabase } from '@/lib/supabase';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';

export type QuestUnit = 'binary' | 'count' | 'time_min' | 'time_hr' | 'clock_time';

export interface QuestLog {
  id: string;
  questId: string;
  logDate: string;
  status: 'active' | 'completed' | 'failed' | 'skip';
  metric: {
    current: number;
    target: number;
    operator: '>=' | '<=';
  };
  unitType: QuestUnit;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  tier: 'Easy' | 'Medium' | 'Boss';
  logs: QuestLog[];
  defaultUnitType: QuestUnit;
  defaultTarget: number;
  defaultOperator: '>=' | '<=';
}

interface QuestContextProps {
  quests: Quest[];
  addQuest: (quest: { 
    title: string; 
    description?: string; 
    tier: 'Easy' | 'Medium' | 'Boss';
    defaultUnitType: QuestUnit;
    defaultTarget: number;
    defaultOperator: '>=' | '<=';
  }) => void;
  updateQuest: (id: string, updates: Partial<Omit<Quest, 'id' | 'logs'>>) => void;
  getTodayLog: (questId: string) => QuestLog | undefined;
  getLogForDate: (questId: string, date: string) => QuestLog | undefined;
  updateLog: (questId: string, date: string, update: Partial<Pick<QuestLog, 'status' | 'metric'>>) => void;
  logQuest: (questId: string, date: string, status: 'completed' | 'failed' | 'skip') => void;
  resetTodayLog: (questId: string) => void;
  resetLog: (questId: string, date: string) => void;
}

const QuestContext = createContext<QuestContextProps | undefined>(undefined);

const getTodayStr = () => new Date().toISOString().split('T')[0];

const evaluateStatus = (current: number, target: number, operator: '>=' | '<='): boolean => {
  if (operator === '>=') return current >= target;
  return current <= target;
};

const getReward = (tier: 'Easy' | 'Medium' | 'Boss') => {
  switch (tier) {
    case 'Easy': return { xp: 10, coins: 5 };
    case 'Medium': return { xp: 30, coins: 15 };
    case 'Boss': return { xp: 50, coins: 25 };
  }
};

const getDamage = (tier: 'Easy' | 'Medium' | 'Boss') => {
  switch (tier) {
    case 'Easy': return 5;
    case 'Medium': return 15;
    case 'Boss': return 40;
  }
};

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const { 
    gainXp, loseXp, earnCoins, loseCoins, takeDamage, healHp, 
    incrementStreak, resetStreak, decrementStreak 
  } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [questsResult, logsResult] = await Promise.all([
        supabase.from('quests').select('*').eq('user_id', user.id),
        supabase.from('quest_logs').select('*').eq('user_id', user.id)
      ]);

      if (questsResult.data) {
        const parsedQuests: Quest[] = questsResult.data.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description || undefined,
          tier: (q.tier as 'Easy' | 'Medium' | 'Boss') || 'Easy',
          defaultUnitType: (q.default_unit_type as QuestUnit) || 'binary',
          defaultTarget: q.default_target ?? 1,
          defaultOperator: (q.default_operator as '>=' | '<=') || '>=',
          logs: logsResult.data?.filter(l => l.quest_id === q.id).map(l => ({
            id: l.id,
            questId: l.quest_id,
            logDate: l.log_date,
            status: l.status as 'active' | 'completed' | 'failed' | 'skip',
            unitType: l.unit_type as QuestUnit,
            metric: {
              current: l.metric_current,
              target: l.metric_target,
              operator: l.metric_operator as '>=' | '<='
            }
          })) || []
        }));
        setQuests(parsedQuests);
      }
    };
    fetchData();
  }, []);

  const getTodayLog = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    return quest?.logs.find(l => l.logDate === getTodayStr());
  };

  const getLogForDate = (questId: string, date: string) => {
    const quest = quests.find(q => q.id === questId);
    return quest?.logs.find(l => l.logDate === date);
  };

  const initializeLog = async (questId: string, date: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newLog: QuestLog = {
      id: `temp-${Date.now()}`,
      questId,
      logDate: date,
      status: 'active',
      unitType: quest.defaultUnitType,
      metric: {
        current: 0,
        target: quest.defaultTarget,
        operator: quest.defaultOperator
      }
    };

    setQuests(prev => prev.map(q => 
      q.id === questId ? { ...q, logs: [...q.logs, newLog] } : q
    ));

    const { data: insertedLog } = await supabase.from('quest_logs').insert({
      user_id: user.id,
      quest_id: questId,
      log_date: date,
      status: 'active',
      unit_type: quest.defaultUnitType,
      metric_current: 0,
      metric_target: quest.defaultTarget,
      metric_operator: quest.defaultOperator
    }).select().single();

    if (insertedLog) {
      setQuests(prev => prev.map(q => 
        q.id === questId ? {
          ...q,
          logs: q.logs.map(l => l.id === newLog.id ? { ...l, id: insertedLog.id } : l)
        } : q
      ));
    }
  };

  const updateLog = async (questId: string, date: string, update: Partial<Pick<QuestLog, 'status' | 'metric'>>) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    let log = getLogForDate(questId, date);
    if (!log) {
      await initializeLog(questId, date);
      log = getLogForDate(questId, date);
      if (!log) return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const oldStatus = log.status;
    let newStatus = update.status || oldStatus;

    if (update.metric && !update.status) {
      const newMetric = { ...log.metric, ...update.metric };
      if (evaluateStatus(newMetric.current, newMetric.target, newMetric.operator)) {
        newStatus = 'completed';
      }
    }

    setQuests(prev => prev.map(q => 
      q.id === questId ? {
        ...q,
        logs: q.logs.map(l => 
          l.logDate === date ? { ...l, ...update, status: newStatus } : l
        )
      } : q
    ));

    if (oldStatus !== newStatus) {
      if (oldStatus === 'completed') {
        const reward = getReward(quest.tier);
        loseXp(reward.xp);
        loseCoins(reward.coins);
        decrementStreak();
      } else if (oldStatus === 'failed') {
        healHp(getDamage(quest.tier));
      }

      if (newStatus === 'completed') {
        const reward = getReward(quest.tier);
        gainXp(reward.xp);
        earnCoins(reward.coins);
        incrementStreak();
      } else if (newStatus === 'failed') {
        takeDamage(getDamage(quest.tier));
        resetStreak();
      }
    }

    await supabase.from('quest_logs').update({
      ...(update.status && { status: update.status }),
      ...(update.metric && {
        metric_current: update.metric.current,
        metric_target: update.metric.target,
        metric_operator: update.metric.operator
      }),
      status: newStatus
    }).eq('quest_id', questId).eq('user_id', user.id).eq('log_date', date);
  };

  const logQuest = (questId: string, date: string, status: 'completed' | 'failed' | 'skip') => {
    updateLog(questId, date, { status });
  };

  const resetLog = async (questId: string, date: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    const log = getLogForDate(questId, date);
    if (!log) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (log.status === 'completed') {
      const reward = getReward(quest.tier);
      loseXp(reward.xp);
      loseCoins(reward.coins);
      decrementStreak();
    } else if (log.status === 'failed') {
      healHp(getDamage(quest.tier));
    }

    setQuests(prev => prev.map(q => 
      q.id === questId ? {
        ...q,
        logs: q.logs.filter(l => l.logDate !== date)
      } : q
    ));

    await supabase.from('quest_logs').delete().eq('quest_id', questId).eq('user_id', user.id).eq('log_date', date);
  };

  const resetTodayLog = (questId: string) => {
    resetLog(questId, getTodayStr());
  };

  const addQuest = async (questData: { 
    title: string; 
    description?: string; 
    tier: 'Easy' | 'Medium' | 'Boss';
    defaultUnitType: QuestUnit;
    defaultTarget: number;
    defaultOperator: '>=' | '<=';
  }) => {
    const tempId = Date.now().toString();
    const newQuest: Quest = {
      ...questData,
      id: tempId,
      logs: []
    };
    setQuests(prev => [...prev, newQuest]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: inserted } = await supabase.from('quests').insert({
      user_id: user.id,
      title: questData.title,
      description: questData.description || null,
      tier: questData.tier,
      default_unit_type: questData.defaultUnitType,
      default_target: questData.defaultTarget,
      default_operator: questData.defaultOperator
    }).select().single();

    if (inserted) {
      setQuests(prev => prev.map(q => q.id === tempId ? { ...q, id: inserted.id } : q));
    }
  };

  const updateQuest = async (id: string, updates: Partial<Omit<Quest, 'id' | 'logs'>>) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('quests').update({
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description || null }),
      ...(updates.tier && { tier: updates.tier }),
      ...(updates.defaultUnitType && { default_unit_type: updates.defaultUnitType }),
      ...(updates.defaultTarget !== undefined && { default_target: updates.defaultTarget }),
      ...(updates.defaultOperator && { default_operator: updates.defaultOperator })
    }).eq('id', id).eq('user_id', user.id);
  };

  return (
    <QuestContext.Provider value={{ 
      quests, 
      addQuest, 
      updateQuest, 
      getTodayLog, 
      getLogForDate,
      updateLog,
      logQuest, 
      resetTodayLog,
      resetLog
    }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuests = () => {
  const context = useContext(QuestContext);
  if (!context) throw new Error('useQuests must be used within QuestProvider');
  return context;
};
