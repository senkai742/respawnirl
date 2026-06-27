import { supabase } from '@/lib/supabase';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  coinReward: number;
  difficulty: 'easy' | 'medium' | 'boss';
  completed: boolean;
  failed: boolean;
}

interface QuestContextProps {
  quests: Quest[];
  completeQuest: (id: string) => void;
  failQuest: (id: string) => void;
  addQuest: (quest: { title: string; description?: string; difficulty: 'easy' | 'medium' | 'boss' }) => void;
  updateQuest: (id: string, updates: { title: string; description?: string; difficulty: 'easy' | 'medium' | 'boss' }) => void;
}

const QuestContext = createContext<QuestContextProps | undefined>(undefined);

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const { gainXp, earnCoins, takeDamage, incrementStreak, resetStreak } = usePlayer();

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      setQuests(data.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description || undefined,
        difficulty: q.difficulty as 'easy' | 'medium' | 'boss',
        xpReward: q.xp_reward,
        coinReward: q.coin_reward,
        completed: false,
        failed: false,
      })));
    }
  };

  const completeQuest = async (id: string) => {
    // Optimistic UI
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: true } : q))
    );
    
    const quest = quests.find((q) => q.id === id);
    if (quest && !quest.completed && !quest.failed) {
      gainXp(quest.xpReward);
      earnCoins(quest.coinReward);
      incrementStreak();
      
      // Update DB
      await supabase.from('quests').update({ status: 'completed' }).eq('id', id);
    }
  };

  const failQuest = async (id: string) => {
    // Optimistic UI
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, failed: true } : q))
    );
    
    const quest = quests.find((q) => q.id === id);
    if (quest && !quest.completed && !quest.failed) {
      let damage = 10;
      if (quest.difficulty === 'medium') damage = 20;
      if (quest.difficulty === 'boss') damage = 50;
      
      takeDamage(damage);
      resetStreak();

      // Update DB
      await supabase.from('quests').update({ status: 'failed' }).eq('id', id);
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
      completed: false,
      failed: false,
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
        status: 'active',
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

  return (
    <QuestContext.Provider value={{ quests, completeQuest, failQuest, addQuest, updateQuest }}>
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
