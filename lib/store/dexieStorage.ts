import { Dexie, type EntityTable } from 'dexie';
import type { StateStorage } from 'zustand/middleware';

interface StoreState {
  key: string;
  value: any;
}

const db = new Dexie('GenUIStoreDB') as Dexie & {
  states: EntityTable<StoreState, 'key'>;
};

db.version(1).stores({
  states: 'key',
});

export const dexieStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const item = await db.states.get(name);
    return item ? JSON.stringify(item.value) : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await db.states.put({ key: name, value: JSON.parse(value) });
  },
  removeItem: async (name: string): Promise<void> => {
    await db.states.delete(name);
  },
};
