import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, UserAttentionType } from "@tauri-apps/api/window";
import { Sidebar } from "./components/Sidebar";
import { WarningModal } from "./components/WarningModal";
import { Dashboard } from "./screens/Dashboard";
import { ProtectedServices } from "./screens/ProtectedServices";
import { SettingsScreen } from "./screens/Settings";
import { useAppState } from "./store";
import {
  getPublicIp,
  getVpnStatus,
  isVpnEffectivelyOn,
  killProcess,
  listRunningApps,
} from "./api";
import { notify, REMINDER_DELAY_MS } from "./notify";
import type { ActiveWarning, ProtectedService, RunningProcess, VpnStatus } from "./types";
import "./App.css";

interface LaunchEvent {
  name: string;
  pid: number;
}

interface PendingReminder {
  serviceId: string;
  serviceLabel: string;
  promisedAt: number;
}

export type Screen = "dashboard" | "services" | "settings";

export interface ActivityEntry {
  id: string;
  kind: "ok" | "warn" | "accent";
  title: string;
  at: number;
}

const MAX_ACTIVITY = 8;

function matchAppService(
  service: ProtectedService,
  running: RunningProcess[],
): boolean {
  if (service.kind !== "app") return false;
  const needle = service.value.toLowerCase();
  return running.some((p) => p.name.toLowerCase().includes(needle));
}

function App() {
  const { state, addService, updateService, removeService, updateSettings } =
    useAppState();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [vpn, setVpn] = useState<VpnStatus | null>(null);
  const [vpnError, setVpnError] = useState(false);
  const [running, setRunning] = useState<RunningProcess[]>([]);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [publicIpError, setPublicIpError] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [warning, setWarning] = useState<ActiveWarning | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [pending, setPending] = useState<PendingReminder[]>([]);
  const dismissedRef = useRef<Set<string>>(new Set());
  const prevEffectiveRef = useRef<boolean | null>(null);
  const prevIpRef = useRef<string | null>(null);
  const servicesRef = useRef(state.services);
  const effectiveOnRef = useRef(false);
  const warningRef = useRef<ActiveWarning | null>(null);
  const recentlyKilledRef = useRef<Map<string, number>>(new Map());
  const prevBehaviorRef = useRef<Map<string, string>>(new Map());

  servicesRef.current = state.services;
  warningRef.current = warning;

  const effectiveOn = useMemo(
    () => isVpnEffectivelyOn(vpn, state.settings.trustedInterfaces),
    [vpn, state.settings.trustedInterfaces],
  );
  effectiveOnRef.current = effectiveOn;

  const matchedAppServices = useMemo(
    () =>
      state.services.filter(
        (s) => s.kind === "app" && matchAppService(s, running),
      ),
    [state.services, running],
  );

  const pushActivity = useCallback(
    (entry: Omit<ActivityEntry, "id" | "at">) => {
      setActivity((prev) =>
        [
          {
            ...entry,
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            at: Date.now(),
          },
          ...prev,
        ].slice(0, MAX_ACTIVITY),
      );
    },
    [],
  );

  const refresh = useCallback(async () => {
    const [vpnResult, procsResult] = await Promise.allSettled([
      getVpnStatus(),
      listRunningApps(),
    ]);
    if (vpnResult.status === "fulfilled") {
      setVpn(vpnResult.value);
      setVpnError(false);
    } else {
      setVpn(null);
      setVpnError(true);
    }
    setRunning(
      procsResult.status === "fulfilled" ? procsResult.value : [],
    );
    setLastChecked(new Date());
    if (state.settings.publicIpCheck) {
      const ip = await getPublicIp();
      setPublicIp(ip);
      setPublicIpError(ip === null);
    } else {
      setPublicIp(null);
      setPublicIpError(false);
    }
  }, [state.settings.publicIpCheck]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, state.settings.pollIntervalSec * 1000);
    return () => window.clearInterval(id);
  }, [refresh, state.settings.pollIntervalSec]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listen<LaunchEvent>("app-launched", async (event) => {
      const proc = event.payload;
      if (effectiveOnRef.current) return;

      const procName = proc.name.toLowerCase();
      const match = servicesRef.current.find(
        (s) => s.kind === "app" && procName.includes(s.value.toLowerCase()),
      );
      if (!match) return;

      if (match.behavior === "block") {
        try {
          await killProcess(proc.pid);
          pushActivity({
            kind: "warn",
            title: `${match.value} killed — VPN was off`,
          });
          notify(
            `VIGIL stopped ${match.value}`,
            "Connect VPN before reopening.",
          );
          setWarning({ service: match, detectedAt: Date.now() });
        } catch (err) {
          pushActivity({
            kind: "warn",
            title: `Couldn't stop ${match.value} (${String(err)})`,
          });
          setWarning({ service: match, detectedAt: Date.now() });
        }
        return;
      }

      if (dismissedRef.current.has(match.id)) return;
      if (warningRef.current?.service.id === match.id) return;

      setWarning({ service: match, detectedAt: Date.now() });
      pushActivity({
        kind: "warn",
        title: `${match.value} just launched while VPN was off`,
      });
      setRunning((prev) =>
        prev.some((p) => p.pid === proc.pid)
          ? prev
          : [...prev, { name: proc.name, pid: proc.pid }],
      );
    }).then((u) => {
      unlisten = u;
    });
    return () => {
      unlisten?.();
    };
  }, [pushActivity]);

  useEffect(() => {
    const prev = prevEffectiveRef.current;
    if (prev === null) {
      prevEffectiveRef.current = effectiveOn;
      return;
    }
    if (prev === effectiveOn) return;
    if (effectiveOn) {
      const iface = vpn?.vpn_interfaces[0];
      pushActivity({
        kind: "ok",
        title: iface ? `VPN connected — ${iface} active` : "VPN connected",
      });
    } else {
      pushActivity({ kind: "warn", title: "VPN disconnected" });
    }
    prevEffectiveRef.current = effectiveOn;
  }, [effectiveOn, vpn, pushActivity]);

  useEffect(() => {
    if (!publicIp) return;
    if (prevIpRef.current && prevIpRef.current !== publicIp) {
      pushActivity({
        kind: "accent",
        title: `Public IP changed to ${publicIp}`,
      });
    }
    prevIpRef.current = publicIp;
  }, [publicIp, pushActivity]);

  useEffect(() => {
    if (effectiveOn) {
      dismissedRef.current.clear();
      recentlyKilledRef.current.clear();
      if (warning) setWarning(null);
      return;
    }

    const now = Date.now();
    for (const svc of matchedAppServices) {
      if (svc.behavior !== "block") continue;
      const procs = running.filter((p) =>
        p.name.toLowerCase().includes(svc.value.toLowerCase()),
      );
      if (procs.length === 0) continue;
      let killedAny = false;
      for (const proc of procs) {
        const key = `${svc.id}:${proc.pid}`;
        const last = recentlyKilledRef.current.get(key) ?? 0;
        if (now - last < 10000) continue;
        recentlyKilledRef.current.set(key, now);
        killProcess(proc.pid)
          .then(() => {
            pushActivity({
              kind: "warn",
              title: `${svc.value} killed — VPN was off`,
            });
            notify(
              `VIGIL stopped ${svc.value}`,
              "Connect VPN before reopening.",
            );
          })
          .catch(() => {});
        killedAny = true;
      }
      if (killedAny && warningRef.current?.service.id !== svc.id) {
        setWarning({ service: svc, detectedAt: Date.now() });
      }
    }

    const candidate = matchedAppServices.find(
      (s) => s.behavior !== "block" && !dismissedRef.current.has(s.id),
    );
    if (candidate && (!warning || warning.service.id !== candidate.id)) {
      setWarning({ service: candidate, detectedAt: Date.now() });
      pushActivity({
        kind: "warn",
        title: `${candidate.value} running while VPN was off`,
      });
    }
  }, [effectiveOn, matchedAppServices, running, warning, pushActivity]);

  useEffect(() => {
    const ids = new Set(state.services.map((s) => s.id));
    for (const svc of state.services) {
      const prev = prevBehaviorRef.current.get(svc.id);
      if (prev !== undefined && prev !== svc.behavior) {
        dismissedRef.current.delete(svc.id);
        for (const key of Array.from(recentlyKilledRef.current.keys())) {
          if (key.startsWith(`${svc.id}:`)) {
            recentlyKilledRef.current.delete(key);
          }
        }
        if (warningRef.current?.service.id === svc.id) {
          setWarning(null);
        }
      }
      prevBehaviorRef.current.set(svc.id, svc.behavior);
    }
    for (const id of Array.from(prevBehaviorRef.current.keys())) {
      if (!ids.has(id)) prevBehaviorRef.current.delete(id);
    }
  }, [state.services]);

  useEffect(() => {
    const win = getCurrentWindow();
    if (warning) {
      win.show().catch(() => {});
      win.unminimize().catch(() => {});
      win.setAlwaysOnTop(true).catch(() => {});
      win.setFocus().catch(() => {});
      win.requestUserAttention(UserAttentionType.Critical).catch(() => {});
    } else {
      win.setAlwaysOnTop(false).catch(() => {});
    }
  }, [warning]);

  useEffect(() => {
    if (!effectiveOn || pending.length === 0) return;
    const labels = pending.map((p) => p.serviceLabel);
    setPending([]);
    pushActivity({
      kind: "ok",
      title: `VPN connected — pending reminder${labels.length === 1 ? "" : "s"} cleared`,
    });
    notify(
      "VIGIL — VPN connected",
      labels.length === 1
        ? `Now protecting ${labels[0]}.`
        : `Now protecting ${labels.length} services.`,
    );
  }, [effectiveOn, pending, pushActivity]);

  useEffect(() => {
    if (pending.length === 0) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setPending((prev) => {
        const remaining: PendingReminder[] = [];
        for (const p of prev) {
          if (now - p.promisedAt < REMINDER_DELAY_MS) {
            remaining.push(p);
            continue;
          }
          notify(
            "VIGIL — VPN still off",
            `${p.serviceLabel} is still running without VPN protection.`,
          );
          pushActivity({
            kind: "warn",
            title: `Reminder sent — ${p.serviceLabel} still without VPN`,
          });
        }
        return remaining;
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [pending.length, pushActivity]);

  function dismissWarning() {
    if (warning && warning.service.behavior === "warn") {
      dismissedRef.current.add(warning.service.id);
    }
    setWarning(null);
  }

  function openAnyway() {
    if (warning) {
      dismissedRef.current.add(warning.service.id);
      const svc = warning.service;
      if (state.settings.remindersEnabled) {
        setPending((prev) => [
          ...prev.filter((p) => p.serviceId !== svc.id),
          {
            serviceId: svc.id,
            serviceLabel: svc.value,
            promisedAt: Date.now(),
          },
        ]);
      }
    }
    setWarning(null);
  }

  return (
    <div className="app">
      <Sidebar current={screen} onNavigate={setScreen} vpnConnected={effectiveOn} />
      <main className="content">
        {screen === "dashboard" && (
          <Dashboard
            vpn={vpn}
            vpnError={vpnError}
            publicIp={publicIp}
            publicIpError={publicIpError}
            publicIpEnabled={state.settings.publicIpCheck}
            effectiveOn={effectiveOn}
            services={state.services}
            runningApps={running}
            matchedAppServices={matchedAppServices}
            lastChecked={lastChecked}
            activity={activity}
          />
        )}
        {screen === "services" && (
          <ProtectedServices
            services={state.services}
            onAdd={addService}
            onUpdate={updateService}
            onRemove={removeService}
          />
        )}
        {screen === "settings" && (
          <SettingsScreen
            settings={state.settings}
            vpn={vpn}
            onUpdate={updateSettings}
          />
        )}
      </main>
      <WarningModal
        warning={warning}
        strictMode={state.settings.strictMode}
        onDismiss={dismissWarning}
        onOpenAnyway={openAnyway}
      />
    </div>
  );
}

export default App;
