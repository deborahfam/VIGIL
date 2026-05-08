import { useEffect, useState } from "react";
import type { AppState, ProtectedService, Settings } from "./types";

const STORAGE_KEY = "vigil:state:v1";

const DEFAULT_SETTINGS: Settings = {
  strictMode: false,
  trustedInterfaces: [],
  pollIntervalSec: 5,
  publicIpCheck: true,
};

const SEED_SERVICES: ProtectedService[] = [
  { id: "seed-1", kind: "app", value: "Telegram", risk: "high", behavior: "warn" },
  { id: "seed-2", kind: "domain", value: "binance.com", risk: "high", behavior: "warn" },
];

function loadState(): AppState {
  if (typeof window === "undefined") {
    return { services: SEED_SERVICES, settings: DEFAULT_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { services: SEED_SERVICES, settings: DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      services: parsed.services ?? SEED_SERVICES,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return { services: SEED_SERVICES, settings: DEFAULT_SETTINGS };
  }
}

function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable; ignore.
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function addService(svc: Omit<ProtectedService, "id">) {
    setState((s) => ({
      ...s,
      services: [
        ...s.services,
        { ...svc, id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ],
    }));
  }

  function updateService(id: string, patch: Partial<ProtectedService>) {
    setState((s) => ({
      ...s,
      services: s.services.map((svc) => (svc.id === id ? { ...svc, ...patch } : svc)),
    }));
  }

  function removeService(id: string) {
    setState((s) => ({ ...s, services: s.services.filter((svc) => svc.id !== id) }));
  }

  function updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }

  return { state, addService, updateService, removeService, updateSettings };
}

export function newServiceTemplate(): Omit<ProtectedService, "id"> {
  return { kind: "app", value: "", risk: "high", behavior: "warn" };
}
