// ABOUTME: Custom Zustand StateStorage adapter backed by Tauri store plugin.
// ABOUTME: Persists Zustand state to a native JSON file via the Tauri store API.

import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { load, type Store } from "@tauri-apps/plugin-store";

let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load("metadata.json", {
      defaults: {},
      autoSave: true,
    });
  }
  return storeInstance;
}

const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const store = await getStore();
    return (await store.get<string>(name)) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const store = await getStore();
    await store.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    const store = await getStore();
    await store.delete(name);
  },
};

export const tauriJSONStorage = createJSONStorage(() => tauriStorage);
