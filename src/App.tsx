import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
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
  listRunningApps,
} from "./api";
import type { ActiveWarning, ProtectedService, RunningProcess, VpnStatus } from "./types";
import "./App.css";

interface LaunchEvent {
  name: string;
  pid: number;
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
  const [running, setRunning] = useState<RunningProcess[]>([]);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [warning, setWarning] = useState<ActiveWarning | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const dismissedRef = useRef<Set<string>>(new Set());
  const prevEffectiveRef = useRef<boolean | null>(null);
  const prevIpRef = useRef<string | null>(null);
  const servicesRef = useRef(state.services);
  const effectiveOnRef = useRef(false);
  const warningRef = useRef<ActiveWarning | null>(null);

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
    const [v, procs] = await Promise.all([
      getVpnStatus().catch(() => null),
      listRunningApps().catch(() => [] as RunningProcess[]),
    ]);
    setVpn(v);
    setRunning(procs);
    setLastChecked(new Date());
    if (state.settings.publicIpCheck) {
      const ip = await getPublicIp();
      setPublicIp(ip);
    } else {
      setPublicIp(null);
    }
  }, [state.settings.publicIpCheck]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, state.settings.pollIntervalSec * 1000);
    return () => window.clearInterval(id);
  }, [refresh, state.settings.pollIntervalSec]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listen<LaunchEvent>("app-launched", (event) => {
      const proc = event.payload;
      if (effectiveOnRef.current) return;

      const procName = proc.name.toLowerCase();
      const match = servicesRef.current.find(
        (s) => s.kind === "app" && procName.includes(s.value.toLowerCase()),
      );
      if (!match) return;
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
      if (warning) setWarning(null);
      return;
    }
    const candidate = matchedAppServices.find(
      (s) => !dismissedRef.current.has(s.id),
    );
    if (candidate && (!warning || warning.service.id !== candidate.id)) {
      setWarning({ service: candidate, detectedAt: Date.now() });
      pushActivity({
        kind: "warn",
        title: `${candidate.value} running while VPN was off`,
      });
    }
  }, [effectiveOn, matchedAppServices, warning, pushActivity]);

  function dismissWarning() {
    if (warning) dismissedRef.current.add(warning.service.id);
    setWarning(null);
  }

  function openAnyway() {
    if (warning) dismissedRef.current.add(warning.service.id);
    setWarning(null);
  }

  return (
    <div className="app">
      <Sidebar current={screen} onNavigate={setScreen} vpnConnected={effectiveOn} />
      <main className="content">
        {screen === "dashboard" && (
          <Dashboard
            vpn={vpn}
            publicIp={publicIp}
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
