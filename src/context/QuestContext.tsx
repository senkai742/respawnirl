import { supabase } from '@/lib/supabase';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';

export interface QuestLog {
  id: string;
  questId: string;
  logDate: string; // YYYY-MM-DD
  status: 'completed' | 'failed';
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  coinReward: number;
  difficulty: 'easy' | 'medium' | 'boss';
  logs: QuestLog[];
}

interface QuestContextProps {
  quests: Quest[];
  logQuest: (questId: string, logDate: string, status: 'completed' | 'failed') => Promise<void>;
  resetQuestLog: (questId: string, logDate: string) => Promise<void>;
  addQuest: (quest: { title: string; description?: string; difficulty: 'easy' | 'medium' | 'boss' }) => void;
  updateQuest: (id: string, updates: { title: string; description?: string; difficulty: 'easy' | 'medium' | 'boss' }) => void;
}

const QuestContext = createContext<QuestContextProps | undefined>(undefined);

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const {
    gainXp,
    loseXp,
    earnCoins,
    loseCoins,
    takeDamage,
    healHp,
    incrementStreak,
    resetStreak,
    decrementStreak,
  } = usePlayer();

  useEffect(() => {
    fetchQuestsAndLogs();
  }, []);

  const fetchQuestsAndLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch all quests
    const { data: questsData, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id);

    if (questsError) {
      console.error('Error fetching quests:', questsError);
      return;
    }

    // 2. Fetch all logs for these quests
    const { data: logsData, error: logsError } = await supabase
      .from('quest_logs')
      .select('*')
      .eq('user_id', user.id);

    if (logsError) {
      console.error('Error fetching quest logs:', logsError);
      // Still proceed with quests, just no logs
      const questsWithEmptyLogs = (questsData || []).map(q => ({
        id: q.id,
        title: q.title,
        description: q.description || undefined,
        difficulty: q.difficulty as 'easy' | 'medium' | 'boss',
        xpReward: q.xp_reward,
        coinReward: q.coin_reward,
        logs: [],
      }));
      setQuests(questsWithEmptyLogs);
      return;
    }

    // 3. Combine quests and logs
    const questsWithLogs = (questsData || []).map(q => {
      const questLogs = (logsData || [])
        .filter(l => l.quest_id === q.id)
        .map(l => ({
          id: l.id,
          questId: l.quest_id,
          logDate: l.log_date,
          status: l.status as 'completed' | 'failed',
        }));
      
      return {
        id: q.id,
        title: q.title,
        description: q.description || undefined,
        difficulty: q.difficulty as 'easy' | 'medium' | 'boss',
        xpReward: q.xp_reward,
        coinReward: q.coin_reward,
        logs: questLogs,
      };
    });
    setQuests(questsWithLogs);
  };

  // Helper to get today's date as YYYY-MM-DD
  const getTodayDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const logQuest = async (
    questId: string,
    logDate: string,
    status: 'completed' | 'failed'
  ) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if there's an existing log for this date
    const existingLog = quest.logs.find(l => l.logDate === logDate);

    // Optimistic UI update first
    setQuests(prev =>
      prev.map(q => {
        if (q.id !== questId) return q;

        let updatedLogs;
        if (existingLog) {
          // Replace existing log
          updatedLogs = q.logs.map(l =>
            l.logDate === logDate ? { ...l, status } : l
          );
        } else {
          // Add new log
          updatedLogs = [...q.logs, {
            id: `temp-${Date.now()}`,
            questId,
            logDate,
            status,
          }];
        }

        return { ...q, logs: updatedLogs };
      })
    );

    // Update player stats based on status and existing log
    if (existingLog) {
      // Revert previous status first
      if (existingLog.status === 'completed') {
        loseXp(quest.xpReward);
        loseCoins(quest.coinReward);
        decrementStreak();
      } else {
        let damage = 5;
        if (quest.difficulty === 'medium') damage = 15;
        if (quest.difficulty === 'boss') damage = 40;
        healHp(damage);
      }
    }

    // Apply new status
    if (status === 'completed') {
      gainXp(quest.xpReward);
      earnCoins(quest.coinReward);
      incrementStreak();
    } else {
      let damage = 5;
      if (quest.difficulty === 'medium') damage = 15;
      if (quest.difficulty === 'boss') damage = 40;
      takeDamage(damage);
      resetStreak();
    }

    // Update database using upsert
    if (existingLog) {
      await supabase
        .from('quest_logs')
        .update({ status })
        .eq('quest_id', questId)
        .eq('user_id', user.id)
        .eq('log_date', logDate);
    } else {
      const { data: newLog, error } = await supabase
        .from('quest_logs')
        .insert({
          quest_id: questId,
          user_id: user.id,
          log_date: logDate,
          status,
        })
        .select()
        .single();
      
      if (!error && newLog) {
        // Update optimistic UI temp ID with real one
        setQuests(prev =>
          prev.map(q =>
            q.id !== questId ? q : {
              ...q,
              logs: q.logs.map(l =>
                l.id.startsWith('temp-') && l.logDate === logDate
                  ? { ...l, id: newLog.id }
                  : l
              ),
            }
          )
        );
      }
    }
  };

  const resetQuestLog = async (questId: string, logDate: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const existingLog = quest.logs.find(l => l.logDate === logDate);
    if (!existingLog) return;

    // Optimistic UI
    setQuests(prev =>
      prev.map(q =>
        q.id !== questId ? q : {
          ...q,
          logs: q.logs.filter(l => l.logDate !== logDate),
        }
      )
    );

    // Revert player stats
    if (existingLog.status === 'completed') {
      loseXp(quest.xpReward);
      loseCoins(quest.coinReward);
      decrementStreak();
    } else {
      let damage = 5;
      if (quest.difficulty === 'medium') damage = 15;
      if (quest.difficulty === 'boss') damage = 40;
      healHp(damage);
    }

    // Delete log from DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('quest_logs')
        .delete()
        .eq('quest_id', questId)
        .eq('user_id', user.id)
        .eq('log_date', logDate);
    }
  };

  const addQuest = async (questData: { title: string; description?: string; difficulty: 'easy' | 'medium' | 'boss' }) => {
    let xpReward = 10;
    let coinReward = 5;
    
    if (questData.difficulty === 'medium') {
      xpReward = 30;
      coinReward = 15;
    } else if (questData.difficulty === 'boss') {
      xpReward = 50;
      coinReward = 25;
    }

    const tempId = Date.now().toString();
    const newQuest: Quest = {
      ...questData,
      id: tempId,
      xpReward,
      coinReward,
      logs: [],
    };
    
    // Optimistic UI
    setQuests((prev) => [...prev, newQuest]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert to DB
    const { data, error } = await supabase
      .from('quests')
      .insert({
        user_id: user.id,
        title: questData.title,
        description: questData.description || null,
        difficulty: questData.difficulty,
        status: 'active', // keep for compatibility, though we don't use it much now
        xp_reward: xpReward,
        coin_reward: coinReward,
      })
      .select()
      .single();

    if (!error && data) {
      // Replace temp ID with real ID
      setQuests(prev => prev.map(q => q.id === tempId ? { ...q, id: data.id } : q));
    }
  };

  const updateQuest = async (id: string, updates: { title: string; description?: string; difficulty: 'easy' | 'medium' | 'boss' }) => {
    let xpReward = 10;
    let coinReward = 5;
    
    if (updates.difficulty === 'medium') {
      xpReward = 30;
      coinReward = 15;
    } else if (updates.difficulty === 'boss') {
      xpReward = 50;
      coinReward = 25;
    }

    // Optimistic UI
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates, xpReward, coinReward } : q))
    );

    // Update DB
    await supabase
      .from('quests')
      .update({
        title: updates.title,
        description: updates.description || null,
        difficulty: updates.difficulty,
        xp_reward: xpReward,
        coin_reward: coinReward,
      })
      .eq('id', id);
  };

  // Also keep old functions for backward compatibility (using today's date)
  const completeQuest = (id: string) => logQuest(id, getTodayDate(), 'completed');
  const failQuest = (id: string) => logQuest(id, getTodayDate(), 'failed');
  const resetQuest = (id: string) => resetQuestLog(id, getTodayDate());

  return (
    <QuestContext.Provider value={{ 
      quests, 
      logQuest, 
      resetQuestLog, 
      addQuest, 
      updateQuest,
      // @ts-ignore: Keep old functions for now to prevent breaking
      completeQuest,
      failQuest,
      resetQuest,
    }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuests = () => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error('useQuests must be used within a QuestProvider');
  }
  return context;
};
