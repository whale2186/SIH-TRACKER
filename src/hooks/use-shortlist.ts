import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocalShortlistItem {
  problemStatementId: number;
  priority: string;
  notes: string;
  createdAt: string;
}

interface ShortlistState {
  items: Record<number, LocalShortlistItem>;
  add: (id: number) => void;
  remove: (id: number) => void;
  update: (id: number, priority: string, notes: string) => void;
  toggle: (id: number) => void;
}

export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set) => ({
      items: {},
      add: (id) =>
        set((state) => ({
          items: {
            ...state.items,
            [id]: {
              problemStatementId: id,
              priority: "Medium",
              notes: "",
              createdAt: new Date().toISOString(),
            },
          },
        })),
      remove: (id) =>
        set((state) => {
          const newItems = { ...state.items };
          delete newItems[id];
          return { items: newItems };
        }),
      update: (id, priority, notes) =>
        set((state) => {
          if (!state.items[id]) return state;
          return {
            items: {
              ...state.items,
              [id]: {
                ...state.items[id],
                priority,
                notes,
              },
            },
          };
        }),
      toggle: (id) =>
        set((state) => {
          const newItems = { ...state.items };
          if (newItems[id]) {
            delete newItems[id];
          } else {
            newItems[id] = {
              problemStatementId: id,
              priority: "Medium",
              notes: "",
              createdAt: new Date().toISOString(),
            };
          }
          return { items: newItems };
        }),
    }),
    {
      name: "sih-shortlist-storage", // name of the item in the storage (must be unique)
    }
  )
);
