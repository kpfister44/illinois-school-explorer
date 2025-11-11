// ABOUTME: Context for managing school comparison state
// ABOUTME: Handles add/remove operations and localStorage persistence

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ComparisonContextType {
  comparisonList: string[];
  addToComparison: (rcdts: string) => void;
  removeFromComparison: (rcdts: string) => void;
  clearComparison: () => void;
  isInComparison: (rcdts: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'school-comparison';
const MAX_SCHOOLS = 5;

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonList, setComparisonList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
  }, [comparisonList]);

  const addToComparison = (rcdts: string) => {
    setComparisonList((prev) => {
      if (prev.includes(rcdts) || prev.length >= MAX_SCHOOLS) {
        return prev;
      }
      return [...prev, rcdts];
    });
  };

  const removeFromComparison = (rcdts: string) => {
    setComparisonList((prev) => prev.filter((id) => id !== rcdts));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const isInComparison = (rcdts: string) => {
    return comparisonList.includes(rcdts);
  };

  const canAddMore = comparisonList.length < MAX_SCHOOLS;

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
