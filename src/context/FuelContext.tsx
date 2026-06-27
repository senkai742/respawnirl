import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  items: ConsumedItem[];
  targets: FuelTargets;
  totals: FuelTargets;
  isOverloaded: boolean;
  addConsumable: (item: Omit<ConsumedItem, 'id'>) => void;
  removeConsumable: (id: string) => void;
}

const defaultTargets: FuelTargets = {
  calories: 2000,
  protein: 130,
  carbs: 220,
  fat: 65,
};

const FuelContext = createContext<FuelContextProps | undefined>(undefined);

export const FuelProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ConsumedItem[]>([]);
  const { gainXp, earnCoins } = usePlayer();

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const isOverloaded = totals.calories > defaultTargets.calories;

  const addConsumable = (itemData: Omit<ConsumedItem, 'id'>) => {
    const newItem: ConsumedItem = { ...itemData, id: Date.now().toString() };
    setItems((prev) => [...prev, newItem]);

    // Check if adding this item keeps us under or at the limit
    // Wait, the logic is: "If a logged item pushes the total calories *over* the 2000 kcal target, block any further XP gains for that food item".
    // Let's calculate what the new total would be
    const newTotalCalories = totals.calories + itemData.calories;
    if (newTotalCalories <= defaultTargets.calories) {
      gainXp(15);
      earnCoins(5);
    }
  };

  const removeConsumable = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <FuelContext.Provider
      value={{
        items,
        targets: defaultTargets,
        totals,
        isOverloaded,
        addConsumable,
        removeConsumable,
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
