"use client";

import { useSyncExternalStore } from "react";
import type { Modo } from "./theme";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): Modo {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function getServerSnapshot(): Modo {
  return "light";
}

/** Detecta o esquema de cores do sistema no cliente (para colorir os gráficos SVG). */
export function useModo(): Modo {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
