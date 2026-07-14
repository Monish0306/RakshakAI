import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "citizen" | "lea" | "bank" | "admin";
export type Lang = "en" | "hi" | "ta" | "te" | "bn" | "mr" | "gu" | "kn" | "ml" | "pa" | "or" | "as";

type AppState = {
  role: Role;
  setRole: (r: Role) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  senior: boolean;
  setSenior: (s: boolean) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
};

const AppCtx = createContext<AppState | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("citizen");
  const [lang, setLang] = useState<Lang>("en");
  const [senior, setSenior] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("senior", senior);
  }, [dark, senior]);

  return (
    <AppCtx.Provider value={{ role, setRole, lang, setLang, senior, setSenior, dark, setDark }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be inside AppProviders");
  return v;
}
