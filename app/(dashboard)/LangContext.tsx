"use client";

import { createContext, useContext } from "react";

export type Lang = "pt" | "en";

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
}

export const LangContext = createContext<LangContextValue>({
  lang: "pt",
  toggleLang: () => {},
});

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
