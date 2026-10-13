// Paleta validada pela skill de dataviz (ver referências em
// dataviz/references/palette.md). Ordem categórica fixa — nunca ciclar.

export const CORES = {
  light: {
    surface: "#fcfcfb",
    surfaceAlt: "#f9f9f7",
    textPrimary: "#0b0b0b",
    textSecondary: "#52514e",
    textMuted: "#898781",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    border: "rgba(11,11,11,0.10)",
    deltaUpGood: "#006300",
    deltaDownBad: "#d03b3b",
    categorico: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
    ordinal: ["#86b6ef", "#5598e7", "#2a78d6", "#184f95"],
    deEmphasis: "#c3c2b7",
    status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
  },
  dark: {
    surface: "#1a1a19",
    surfaceAlt: "#0d0d0d",
    textPrimary: "#ffffff",
    textSecondary: "#c3c2b7",
    textMuted: "#898781",
    grid: "#2c2c2a",
    axis: "#383835",
    border: "rgba(255,255,255,0.10)",
    deltaUpGood: "#0ca30c",
    deltaDownBad: "#e66767",
    categorico: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
    ordinal: ["#86b6ef", "#5598e7", "#2a78d6", "#184f95"],
    deEmphasis: "#52514e",
    status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
  },
} as const;

export type Modo = keyof typeof CORES;
