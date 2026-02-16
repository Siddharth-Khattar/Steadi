// ABOUTME: Zustand store for teleprompter state with persisted preferences and runtime state.
// ABOUTME: Preferences (font size, opacity, speed preset) persist via Tauri store; runtime state resets on each session.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tauriJSONStorage } from "../persistence/tauriStorage";

type SpeedPreset = "slow" | "medium" | "fast";

export const SPEED_VALUES: Record<SpeedPreset, number> = {
  slow: 30,
  medium: 52,
  fast: 82,
};

const SPEED_CYCLE: SpeedPreset[] = ["slow", "medium", "fast"];

const FONT_SIZE_MIN = 18;
const FONT_SIZE_MAX = 64;
const FONT_SIZE_STEP = 2;

const OPACITY_MIN = 0.3;
const OPACITY_MAX = 1.0;
const OPACITY_STEP = 0.05;

interface TeleprompterPreferences {
  fontSize: number;
  opacity: number;
  speedPreset: SpeedPreset;
}

interface TeleprompterRuntimeState {
  isPlaying: boolean;
  scriptContent: string;
  showCountdown: boolean;
  countdownValue: number;
  scrollProgress: number;
}

interface TeleprompterActions {
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  cycleSpeed: () => void;
  setScriptContent: (content: string) => void;
  startCountdown: () => void;
  decrementCountdown: () => void;
  setScrollProgress: (progress: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  increaseOpacity: () => void;
  decreaseOpacity: () => void;
  resetTeleprompter: () => void;
}

type TeleprompterStore = TeleprompterPreferences &
  TeleprompterRuntimeState &
  TeleprompterActions;

export const useTeleprompterStore = create<TeleprompterStore>()(
  persist(
    (set, get) => ({
      // Persisted preferences
      fontSize: 24,
      opacity: 0.95,
      speedPreset: "medium" as SpeedPreset,

      // Runtime state (not persisted)
      isPlaying: false,
      scriptContent: "",
      showCountdown: false,
      countdownValue: 3,
      scrollProgress: 0,

      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      setPlaying: (playing: boolean) => {
        set({ isPlaying: playing });
      },

      cycleSpeed: () => {
        const { speedPreset } = get();
        const currentIndex = SPEED_CYCLE.indexOf(speedPreset);
        const nextIndex = (currentIndex + 1) % SPEED_CYCLE.length;
        set({ speedPreset: SPEED_CYCLE[nextIndex] });
      },

      setScriptContent: (content: string) => {
        set({ scriptContent: content });
      },

      startCountdown: () => {
        set({ showCountdown: true, countdownValue: 3 });
      },

      decrementCountdown: () => {
        const { countdownValue } = get();
        const next = countdownValue - 1;
        if (next <= 0) {
          set({ showCountdown: false, countdownValue: 0, isPlaying: true });
        } else {
          set({ countdownValue: next });
        }
      },

      setScrollProgress: (progress: number) => {
        set({ scrollProgress: Math.max(0, Math.min(1, progress)) });
      },

      increaseFontSize: () => {
        const { fontSize } = get();
        set({ fontSize: Math.min(fontSize + FONT_SIZE_STEP, FONT_SIZE_MAX) });
      },

      decreaseFontSize: () => {
        const { fontSize } = get();
        set({ fontSize: Math.max(fontSize - FONT_SIZE_STEP, FONT_SIZE_MIN) });
      },

      increaseOpacity: () => {
        const { opacity } = get();
        const next = Math.min(opacity + OPACITY_STEP, OPACITY_MAX);
        // Round to avoid floating point drift
        set({ opacity: Math.round(next * 100) / 100 });
      },

      decreaseOpacity: () => {
        const { opacity } = get();
        const next = Math.max(opacity - OPACITY_STEP, OPACITY_MIN);
        set({ opacity: Math.round(next * 100) / 100 });
      },

      resetTeleprompter: () => {
        set({
          isPlaying: false,
          scriptContent: "",
          showCountdown: false,
          countdownValue: 3,
          scrollProgress: 0,
        });
      },
    }),
    {
      name: "teleprompter-store",
      storage: tauriJSONStorage,
      partialize: (state) => ({
        fontSize: state.fontSize,
        opacity: state.opacity,
        speedPreset: state.speedPreset,
      }),
    },
  ),
);
