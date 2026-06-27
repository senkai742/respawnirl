import { supabase } from '@/lib/supabase';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';

export interface ConsumedItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FuelTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FuelContextProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  items: ConsumedItem[];
  targets: FuelTargets;
  totals: FuelTargets;
  isOverloaded: boolean;
  addConsumable: (item: Omit<ConsumedItem, 'id'>) => void;
  removeConsumable: (id: string) => void;
  updateTargets: (targets: FuelTargets) => void;
}

const defaultTargets: FuelTargets = {
  calories: 2000,
  protein: 130,
  carbs: 220,
  fat: 65,
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const FuelContext = createContext<FuelContextProps | undefined>(undefined);

export const FuelProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [itemsByDate, setItemsByDate] = useState<Record<string, ConsumedItem[]>>({});
  const [targetsByDate, setTargetsByDate] = useState<Record<string, FuelTargets>>({});
  const { gainXp, earnCoins } = usePlayer();

  useEffect(() => {
    fetchFuelDataForDate(selectedDate);
  }, [selectedDate]);

  const fetchFuelDataForDate = async (dateStr: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch targets
    const { data: targetsData } = await supabase
      .from('fuel_targets')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle();

    if (targetsData) {
      setTargetsByDate(prev => ({
        ...prev,
        [dateStr]: {
          calories: targetsData.calories,
          protein: targetsData.protein,
          carbs: targetsData.carbs,
          fat: targetsData.fat,
        }
      }));
    }

    // Fetch items
    const { data: itemsData } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr);

    if (itemsData) {
      setItemsByDate(prev => ({
        ...prev,
        [dateStr]: itemsData.map(item => ({
          id: item.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        }))
      }));
    }
  };

  const items = itemsByDate[selectedDate] || [];
  const targets = targetsByDate[selectedDate] || defaultTargets;

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const isOverloaded = totals.calories > targets.calories;

  const addConsumable = async (itemData: Omit<ConsumedItem, 'id'>) => {
    const tempId = Date.now().toString();
    const tempItem: ConsumedItem = { ...itemData, id: tempId };
    
    // Optimistic UI update
    setItemsByDate((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), tempItem],
    }));

    const newTotalCalories = totals.calories + itemData.calories;
    if (newTotalCalories <= targets.calories) {
      gainXp(15);
      earnCoins(5);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('fuel_logs')
      .insert({
        user_id: user.id,
        date: selectedDate,
        name: itemData.name,
        calories: itemData.calories,
        protein: itemData.protein,
        carbs: itemData.carbs,
        fat: itemData.fat,
      })
      .select()
      .single();

    if (!error && data) {
      // replace temp id with real id from DB
      setItemsByDate(prev => ({
        ...prev,
        [selectedDate]: (prev[selectedDate] || []).map(i => i.id === tempId ? { ...i, id: data.id } : i)
      }));
    }
  };

  const removeConsumable = async (id: string) => {
    // Optimistic UI
    setItemsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter((item) => item.id !== id),
    }));

    // Backend Delete
    await supabase.from('fuel_logs').delete().eq('id', id);
  };

  const updateTargets = async (newTargets: FuelTargets) => {
    // Optimistic UI
    setTargetsByDate((prev) => ({
      ...prev,
      [selectedDate]: newTargets,
    }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert into Supabase
    await supabase.from('fuel_targets').upsert({
      user_id: user.id,
      date: selectedDate,
      calories: newTargets.calories,
      protein: newTargets.protein,
      carbs: newTargets.carbs,
      fat: newTargets.fat,
    }, { onConflict: 'user_id, date' });
  };

  return (
    <FuelContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        items,
        targets,
        totals,
        isOverloaded,
        addConsumable,
        removeConsumable,
        updateTargets,
      }}
    >
      {children}
    </FuelContext.Provider>
  );
};

export const useFuel = () => {
  const context = useContext(FuelContext);
  if (!context) {
    throw new Error('useFuel must be used within a FuelProvider');
  }
  return context;
};
