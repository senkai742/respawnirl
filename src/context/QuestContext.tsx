import React, { createContext, useContext, useState, ReactNode } from 'react';
import { usePlayer } from './PlayerContext';

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  completed: boolean;
  failed: boolean;
}

interface QuestContextProps {
  quests: Quest[];
  completeQuest: (id: string) => void;
  failQuest: (id: string) => void;
  addQuest: (quest: Omit<Quest, 'id' | 'completed' | 'failed'>) => void;
}

const initialQuests: Quest[] = [
  {
    id: '1',
    title: 'Wake up before 8 AM',
    description: 'Defeat the Sleep Demon',
    xpReward: 20,
    coinReward: 10,
    difficulty: 'medium',
    completed: false,
    failed: false,
  },
  {
    id: '2',
    title: 'Drink 2L of water',
    description: 'Hydration is key to survival',
    xpReward: 10,
    coinReward: 5,
    difficulty: 'easy',
    completed: false,
    failed: false,
  },
  {
    id: '3',
    title: 'Code for 2 hours without distraction',
    description: 'Deep Work Boss Fight',
    xpReward: 100,
    coinReward: 50,
    difficulty: 'boss',
    completed: false,
    failed: false,
  },
];

const QuestContext = createContext<QuestContextProps | undefined>(undefined);

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const { gainXp, earnCoins, takeDamage, incrementStreak, resetStreak } = usePlayer();

  const completeQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: true } : q))
    );
    const quest = quests.find((q) => q.id === id);
    if (quest && !quest.completed && !quest.failed) {
      gainXp(quest.xpReward);
      earnCoins(quest.coinReward);
      incrementStreak();
    }
  };

  const failQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, failed: true } : q))
    );
    const quest = quests.find((q) => q.id === id);
    if (quest && !quest.completed && !quest.failed) {
      let damage = 10;
      if (quest.difficulty === 'medium') damage = 20;
      if (quest.difficulty === 'hard') damage = 35;
      if (quest.difficulty === 'boss') damage = 50;
      
      takeDamage(damage);
      resetStreak();
    }
  };

  const addQuest = (questData: Omit<Quest, 'id' | 'completed' | 'failed'>) => {
    const newQuest: Quest = {
      ...questData,
      id: Date.now().toString(),
      completed: false,
      failed: false,
    };
    setQuests((prev) => [...prev, newQuest]);
  };

  return (
    <QuestContext.Provider value={{ quests, completeQuest, failQuest, addQuest }}>
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
