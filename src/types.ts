export type ServiceKind = "app" | "domain";
export type Behavior = "warn" | "block";
export type RiskLevel = "high" | "medium" | "low";

export interface ProtectedService {
  id: string;
  kind: ServiceKind;
  value: string;
  risk: RiskLevel;
  behavior: Behavior;
  notes?: string;
}

export interface Settings {
  strictMode: boolean;
  trustedInterfaces: string[];
  pollIntervalSec: number;
  publicIpCheck: boolean;
  remindersEnabled: boolean;
}

export interface VpnStatus {
  connected: boolean;
  vpn_interfaces: string[];
  all_interfaces: string[];
}

export interface RunningProcess {
  name: string;
  pid: number;
}

export interface AppState {
  services: ProtectedService[];
  settings: Settings;
}

export interface ActiveWarning {
  service: ProtectedService;
  detectedAt: number;
}
