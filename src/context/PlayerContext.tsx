import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Title = 'Tutorial NPC' | 'Novice Adventurer' | 'Procrastination King' | 'Life Hacker' | 'Main Character';

export interface PlayerState {
  hp: number;
  maxHp: number;
  xp: number;
  maxXp: number;
  level: number;
  coins: number;
  streak: number;
  title: Title;
}

interface PlayerContextProps {
  state: PlayerState;
  takeDamage: (amount: number) => void;
  gainXp: (amount: number) => void;
  earnCoins: (amount: number) => void;
  resetStreak: () => void;
  incrementStreak: () => void;
}

const initialState: PlayerState = {
  hp: 100,
  maxHp: 100,
  xp: 0,
  maxXp: 100,
  level: 1,
  coins: 0,
  streak: 0,
  title: 'Novice Adventurer',
};

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PlayerState>(initialState);

  const takeDamage = (amount: number) => {
    setState((prev) => ({
      ...prev,
      hp: Math.max(0, prev.hp - amount),
      // Possibly trigger game over or punishment if HP hits 0
    }));
  };

  const gainXp = (amount: number) => {
    setState((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      if (newXp >= newMaxXp) {
        newLevel += 1;
        newXp = newXp - newMaxXp;
        newMaxXp = Math.floor(newMaxXp * 1.5); // Increase max XP requirement per level
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
      };
    });
  };

  const earnCoins = (amount: number) => {
    setState((prev) => ({ ...prev, coins: prev.coins + amount }));
  };

  const resetStreak = () => {
    setState((prev) => ({ ...prev, streak: 0 }));
  };

  const incrementStreak = () => {
    setState((prev) => ({ ...prev, streak: prev.streak + 1 }));
  };

  return (
    <PlayerContext.Provider
      value={{
        state,
        takeDamage,
        gainXp,
        earnCoins,
        resetStreak,
        incrementStreak,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
