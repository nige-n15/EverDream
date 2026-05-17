import { Platform } from "react-native";

export const everdreamTheme = {
  colors: {
    background: "#f4efe6",
    surface: "#f8f5ee",
    panel: "#efe4cf",
    panelStrong: "#e4d2b0",
    ink: "#17211f",
    muted: "#5f6965",
    accent: "#0f766e",
    accentSoft: "#d7efe9",
    clay: "#b85c38",
    claySoft: "#f3dfd5",
    gold: "#d5a439",
    goldSoft: "#f4e3b4",
    berry: "#8a3156",
    berrySoft: "#f2dce6",
    line: "#d4c4aa",
    warning: "#8f4a1f",
    deepWater: "#204b57",
    sleepRem: "#3e7cb1",
    sleepDeep: "#37515f",
    sleepLight: "#d5a439",
    sleepAwake: "#c87f46",
  },
  displayFont: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: undefined,
  }),
  radius: {
    frame: 8,
  },
} as const;

export const sharedSpacing = {
  gutter: 24,
  band: 24,
} as const;
