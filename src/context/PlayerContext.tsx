import { supabase } from '@/lib/supabase';
import { Title } from '@/utils/title';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
  loading: boolean;
  leveledUp: boolean;
  clearLevelUp: () => void;
  takeDamage: (amount: number) => void;
  healHp: (amount: number) => void;
  gainXp: (amount: number) => void;
  loseXp: (amount: number) => void;
  earnCoins: (amount: number) => void;
  loseCoins: (amount: number) => void;
  resetStreak: () => void;
  incrementStreak: () => void;
  decrementStreak: () => void;
  updateTitle: (newTitle: Title) => void;
}

const initialState: PlayerState = {
  hp: 100,
  maxHp: 100,
  xp: 0,
  maxXp: 100,
  level: 1,
  coins: 0,
  streak: 0,
  title: 'Procrastination King', // Default title
};

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PlayerState>(initialState);
  const [loading, setLoading] = useState(true);
  const [leveledUp, setLeveledUp] = useState(false);

  // Fetch player state from database on mount
  useEffect(() => {
    const fetchPlayerState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('hp, max_hp, xp, max_xp, level, coins, streak, title')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setState({
          hp: data.hp,
          maxHp: data.max_hp,
          xp: data.xp,
          maxXp: data.max_xp,
          level: data.level,
          coins: data.coins,
          streak: data.streak,
          title: data.title as Title,
        });
      }
      setLoading(false);
    };

    fetchPlayerState();
  }, []);

  const clearLevelUp = () => {
    setLeveledUp(false);
  };

  // Helper to save state to database
  const saveStateToDatabase = async (newState: PlayerState) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        hp: newState.hp,
        max_hp: newState.maxHp,
        xp: newState.xp,
        max_xp: newState.maxXp,
        level: newState.level,
        coins: newState.coins,
        streak: newState.streak,
        title: newState.title,
      })
      .eq('id', user.id);
  };

  const takeDamage = (amount: number) => {
    setState(prev => {
      const newState = {
        ...prev,
        hp: Math.max(0, prev.hp - amount),
      };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const healHp = (amount: number) => {
    setState(prev => {
      const newState = {
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + amount),
      };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const gainXp = (amount: number) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;
      let didLevelUp = false;

      // Level up as much as possible
      while (newXp >= newMaxXp) {
        newXp = newXp - newMaxXp;
        newLevel += 1;
        newMaxXp = 100 + (newLevel - 1) * 50;
        didLevelUp = true;
      }

      if (didLevelUp) {
        setLeveledUp(true);
      }

      const newState = {
        ...prev,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
      };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const loseXp = (amount: number) => {
    setState(prev => {
      let newXp = prev.xp - amount;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;

      // If XP goes negative, decrease level
      while (newXp < 0 && newLevel > 1) {
        newLevel -= 1;
        newMaxXp = 100 + (newLevel - 1) * 50;
        newXp = newMaxXp + newXp;
      }

      // Don't let XP go below 0 if we're at level 1
      newXp = Math.max(0, newXp);

      const newState = {
        ...prev,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
      };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const earnCoins = (amount: number) => {
    setState(prev => {
      const newState = { ...prev, coins: prev.coins + amount };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const loseCoins = (amount: number) => {
    setState(prev => {
      const newState = { ...prev, coins: Math.max(0, prev.coins - amount) };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const resetStreak = () => {
    setState(prev => {
      const newState = { ...prev, streak: 0 };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const incrementStreak = () => {
    setState(prev => {
      const newState = { ...prev, streak: prev.streak + 1 };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const decrementStreak = () => {
    setState(prev => {
      const newState = { ...prev, streak: Math.max(0, prev.streak - 1) };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  const updateTitle = (newTitle: Title) => {
    setState(prev => {
      const newState = { ...prev, title: newTitle };
      saveStateToDatabase(newState);
      return newState;
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        state,
        loading,
        leveledUp,
        clearLevelUp,
        takeDamage,
        healHp,
        gainXp,
        loseXp,
        earnCoins,
        loseCoins,
        resetStreak,
        incrementStreak,
        decrementStreak,
        updateTitle,
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
