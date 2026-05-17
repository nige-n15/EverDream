import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SleepSession } from "../types/database";

export type MoodSlot = "morning" | "evening";

export interface MoodEntry {
  id: string;
  date: string;
  slot: MoodSlot;
  emotion_levels: Record<string, number>;
  reflection: string;
  updated_at: string;
}

export interface AppProfileSettings {
  email: string;
  nickname: string;
  wallet_address: string;
  t_social_score: number;
  privacy_profile: "public" | "private";
  privacy_dreams: "private" | "copyleft" | "remix";
  nft_visibility: "public" | "private";
  biometric_lock: boolean;
  two_factor_enabled: boolean;
  theme_preference: "sun" | "night" | "moss";
  wearable_integrations: {
    oura: boolean;
    apple_health: boolean;
    whoop: boolean;
  };
  custom_emotions: string[];
}

interface AppPreferencesState {
  sleep_sessions: SleepSession[];
  mood_entries: MoodEntry[];
  profile: AppProfileSettings;
  selected_sleep_date: string;
  setSelectedSleepDate: (date: string) => void;
  upsertSleepSession: (session: SleepSession) => void;
  saveMoodEntry: (entry: MoodEntry) => void;
  updateProfile: (updates: Partial<AppProfileSettings>) => void;
  toggleWearableIntegration: (provider: keyof AppProfileSettings["wearable_integrations"]) => void;
  addCustomEmotion: (emotion: string) => void;
}

function createId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isoDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildSampleSleepSessions(): SleepSession[] {
  return [
    {
      id: createId("sleep"),
      user_id: "local-user",
      date: isoDate(0),
      score: 82,
      rem_minutes: 96,
      deep_minutes: 78,
      light_minutes: 241,
      awake_minutes: 21,
      total_sleep_minutes: 415,
      source: "manual",
      wearable_device: null,
      raw_data: {
        note: "Woke once around dawn.",
      },
      created_at: new Date().toISOString(),
    },
    {
      id: createId("sleep"),
      user_id: "local-user",
      date: isoDate(1),
      score: 74,
      rem_minutes: 82,
      deep_minutes: 61,
      light_minutes: 228,
      awake_minutes: 34,
      total_sleep_minutes: 371,
      source: "manual",
      wearable_device: null,
      raw_data: {},
      created_at: new Date().toISOString(),
    },
    {
      id: createId("sleep"),
      user_id: "local-user",
      date: isoDate(2),
      score: 88,
      rem_minutes: 103,
      deep_minutes: 89,
      light_minutes: 254,
      awake_minutes: 12,
      total_sleep_minutes: 446,
      source: "manual",
      wearable_device: null,
      raw_data: {},
      created_at: new Date().toISOString(),
    },
    {
      id: createId("sleep"),
      user_id: "local-user",
      date: isoDate(3),
      score: 69,
      rem_minutes: 71,
      deep_minutes: 52,
      light_minutes: 232,
      awake_minutes: 42,
      total_sleep_minutes: 355,
      source: "manual",
      wearable_device: null,
      raw_data: {},
      created_at: new Date().toISOString(),
    },
    {
      id: createId("sleep"),
      user_id: "local-user",
      date: isoDate(4),
      score: 77,
      rem_minutes: 88,
      deep_minutes: 66,
      light_minutes: 247,
      awake_minutes: 24,
      total_sleep_minutes: 401,
      source: "manual",
      wearable_device: null,
      raw_data: {},
      created_at: new Date().toISOString(),
    },
  ];
}

const webStorage = {
  getItem: (name: string) => {
    if (typeof globalThis.localStorage === "undefined") {
      return Promise.resolve(null);
    }

    return Promise.resolve(globalThis.localStorage.getItem(name));
  },
  setItem: (name: string, value: string) => {
    if (typeof globalThis.localStorage === "undefined") {
      return Promise.resolve();
    }

    globalThis.localStorage.setItem(name, value);
    return Promise.resolve();
  },
  removeItem: (name: string) => {
    if (typeof globalThis.localStorage === "undefined") {
      return Promise.resolve();
    }

    globalThis.localStorage.removeItem(name);
    return Promise.resolve();
  },
};

const initialProfile: AppProfileSettings = {
  email: "dreamer@everdream.app",
  nickname: "Chiang Mai Dreamer",
  wallet_address: "0x9ce8...5ad1",
  t_social_score: 1,
  privacy_profile: "public",
  privacy_dreams: "private",
  nft_visibility: "public",
  biometric_lock: true,
  two_factor_enabled: false,
  theme_preference: "sun",
  wearable_integrations: {
    oura: false,
    apple_health: true,
    whoop: false,
  },
  custom_emotions: ["Tender", "Restless"],
};

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      sleep_sessions: buildSampleSleepSessions(),
      mood_entries: [
        {
          id: createId("mood"),
          date: isoDate(0),
          slot: "morning",
          emotion_levels: {
            Happy: 2,
            Sad: 0,
            Angry: 0,
            Fearful: 1,
            Surprised: 3,
            Disgusted: 0,
            Tender: 4,
          },
          reflection: "Woke with a clear image of a flooded station and felt unexpectedly calm.",
          updated_at: new Date().toISOString(),
        },
      ],
      profile: initialProfile,
      selected_sleep_date: isoDate(0),
      setSelectedSleepDate: (date) => {
        set({ selected_sleep_date: date });
      },
      upsertSleepSession: (session) => {
        set((state) => {
          const existingIndex = state.sleep_sessions.findIndex((item) => item.id === session.id || item.date === session.date);

          if (existingIndex === -1) {
            return {
              sleep_sessions: [session, ...state.sleep_sessions].sort((left, right) => right.date.localeCompare(left.date)),
            };
          }

          const next = [...state.sleep_sessions];
          next[existingIndex] = session;
          next.sort((left, right) => right.date.localeCompare(left.date));
          return { sleep_sessions: next };
        });
      },
      saveMoodEntry: (entry) => {
        set((state) => {
          const existingIndex = state.mood_entries.findIndex((item) => item.date === entry.date && item.slot === entry.slot);

          if (existingIndex === -1) {
            return {
              mood_entries: [entry, ...state.mood_entries].sort((left, right) => right.updated_at.localeCompare(left.updated_at)),
            };
          }

          const next = [...state.mood_entries];
          next[existingIndex] = entry;
          next.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
          return { mood_entries: next };
        });
      },
      updateProfile: (updates) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
          },
        }));
      },
      toggleWearableIntegration: (provider) => {
        set((state) => ({
          profile: {
            ...state.profile,
            wearable_integrations: {
              ...state.profile.wearable_integrations,
              [provider]: !state.profile.wearable_integrations[provider],
            },
          },
        }));
      },
      addCustomEmotion: (emotion) => {
        const trimmed = emotion.trim();

        if (!trimmed) {
          return;
        }

        set((state) => {
          if (state.profile.custom_emotions.includes(trimmed)) {
            return state;
          }

          return {
            profile: {
              ...state.profile,
              custom_emotions: [...state.profile.custom_emotions, trimmed],
            },
          };
        });
      },
    }),
    {
      name: "everdream-preferences",
      storage: createJSONStorage(() => (Platform.OS === "web" ? webStorage : AsyncStorage)),
      version: 1,
    },
  ),
);
