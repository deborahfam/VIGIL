import { invoke } from "@tauri-apps/api/core";
import type { RunningProcess, VpnStatus } from "./types";

export async function getVpnStatus(): Promise<VpnStatus> {
  return await invoke<VpnStatus>("vpn_status");
}

export async function listRunningApps(): Promise<RunningProcess[]> {
  return await invoke<RunningProcess[]>("list_running_apps");
}

export async function getPublicIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? null;
  } catch {
    return null;
  }
}

export function isVpnEffectivelyOn(
  status: VpnStatus | null,
  trusted: string[],
): boolean {
  if (!status) return false;
  if (status.connected) return true;
  if (trusted.length === 0) return false;
  return status.all_interfaces.some((name) => trusted.includes(name));
}
