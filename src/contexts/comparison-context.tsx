import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ComparisonItem = {
  id: string;
  name: string;
};

type ComparisonContextType = {
  items: ComparisonItem[];
  add: (item: ComparisonItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
};

const ComparisonContext = createContext<ComparisonContextType | null>(null);

const MAX_ITEMS = 3;

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>([]);

  const add = useCallback((item: ComparisonItem) => {
    setItems((prev) => {
      if (prev.length >= MAX_ITEMS || prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  return (
    <ComparisonContext.Provider
      value={{ items, add, remove, clear, has, isFull: items.length >= MAX_ITEMS }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
