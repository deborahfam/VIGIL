import { LayoutDashboard, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import type { Screen } from "../App";

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
  vpnConnected: boolean;
}

const ITEMS: { id: Screen; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "services", label: "Protected services", Icon: ShieldCheck },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

export function Sidebar({ current, onNavigate, vpnConnected }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand__mark" src="/vigil-icon.svg" alt="" width={32} height={32} />
        <span className="brand__name">VIGIL</span>
      </div>

      <div className={`sidebar__status sidebar__status--${vpnConnected ? "ok" : "warn"}`}>
        <span className="sidebar__dot" aria-hidden />
        {vpnConnected ? "VPN connected" : "VPN off"}
      </div>

      <div className="sidebar__section">NAVIGATION</div>
      <nav className="nav">
        {ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav__item ${current === id ? "nav__item--active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <Icon className="nav__icon" size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar__spacer" />
      <div className="sidebar__foot">v0.1 — MVP · by dbyta</div>
    </aside>
  );
}
