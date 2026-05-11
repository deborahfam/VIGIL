import { Check, Globe, Shield, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ProtectedService, RunningProcess, VpnStatus } from "../types";
import { StatusPill } from "../components/StatusPill";
import type { ActivityEntry } from "../App";

interface Props {
  vpn: VpnStatus | null;
  vpnError: boolean;
  publicIp: string | null;
  publicIpError: boolean;
  publicIpEnabled: boolean;
  effectiveOn: boolean;
  services: ProtectedService[];
  runningApps: RunningProcess[];
  matchedAppServices: ProtectedService[];
  lastChecked: Date | null;
  activity: ActivityEntry[];
}

function formatAgo(d: Date | null): string {
  if (!d) return "—";
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 5) return "Just now";
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.round(sec / 60);
  return `${min} minute${min === 1 ? "" : "s"} ago`;
}

const ACTIVITY_ICON = {
  ok: { Icon: Check, cls: "ok" as const },
  warn: { Icon: TriangleAlert, cls: "warn" as const },
  accent: { Icon: Globe, cls: "accent" as const },
};

export function Dashboard({
  vpn,
  vpnError,
  publicIp,
  publicIpError,
  publicIpEnabled,
  effectiveOn,
  services,
  runningApps,
  matchedAppServices,
  lastChecked,
  activity,
}: Props) {
  const activeIface = vpn?.vpn_interfaces[0] ?? "none";
  const triggering = matchedAppServices.length;
  const chipServices = services.slice(0, 3);

  let publicIpDisplay: string;
  let publicIpClass = "mono";
  if (!publicIpEnabled) {
    publicIpDisplay = "Disabled";
    publicIpClass = "muted";
  } else if (publicIpError) {
    publicIpDisplay = "Unavailable";
    publicIpClass = "warn-text";
  } else if (publicIp) {
    publicIpDisplay = publicIp;
  } else {
    publicIpDisplay = "—";
    publicIpClass = "muted";
  }

  return (
    <div className="screen">
      <header className="screen__head">
        <div className="screen__title">
          <h1>Dashboard</h1>
          <p>Real-time VPN guard for protected services</p>
        </div>
        <StatusPill connected={effectiveOn} />
      </header>

      <section className="cards-row">
        <div className="card">
          <div className="card__head">
            <span className="eyebrow">VPN STATUS</span>
            {effectiveOn ? (
              <ShieldCheck size={16} strokeWidth={2} color="var(--success)" />
            ) : (
              <Shield size={16} strokeWidth={2} color="var(--warn)" />
            )}
          </div>
          <div className="status-big">
            <span
              className={`status-big__dot ${effectiveOn ? "" : "status-big__dot--off"}`}
              aria-hidden
            />
            <span className="status-big__label">
              {vpnError
                ? "Unknown"
                : effectiveOn
                  ? "Connected"
                  : "Not connected"}
            </span>
          </div>
          {vpnError && (
            <p className="muted-block warn-text" style={{ margin: 0 }}>
              Could not read network interfaces. Retrying every refresh.
            </p>
          )}
          <div className="card__sep" />
          <dl className="detail-rows">
            <div className="detail-row">
              <dt>Active interface</dt>
              <dd className="mono">{vpnError ? "—" : activeIface}</dd>
            </div>
            <div className="detail-row">
              <dt>Public IP</dt>
              <dd className={publicIpClass}>{publicIpDisplay}</dd>
            </div>
            <div className="detail-row">
              <dt>Last checked</dt>
              <dd>{formatAgo(lastChecked)}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <div className="card__head">
            <span className="eyebrow">PROTECTION</span>
            <Shield size={16} strokeWidth={2} color="var(--accent)" />
          </div>
          <div className="stat-big">
            <span className="stat-big__num">{services.length}</span>
            <span className="stat-big__lbl">protected services</span>
          </div>
          <div className="card__sep" />
          <dl className="detail-rows">
            <div className="detail-row">
              <dt>Apps detected</dt>
              <dd>{runningApps.length} running</dd>
            </div>
            <div className="detail-row">
              <dt>Currently matched</dt>
              <dd className={triggering > 0 && !effectiveOn ? "warn-text" : "success-text"}>
                {triggering === 0 ? "None" : `${triggering} running`}
              </dd>
            </div>
          </dl>
          {chipServices.length > 0 && (
            <div className="chip-row">
              {chipServices.map((s) => (
                <span key={s.id} className="chip">{s.value}</span>
              ))}
              {services.length > chipServices.length && (
                <span className="chip chip--more">
                  + {services.length - chipServices.length} more
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {triggering > 0 && !effectiveOn && (
        <section className="alert alert--warn">
          <strong>
            {triggering} protected service{triggering === 1 ? "" : "s"} running without VPN.
          </strong>
          <span>
            Connect your VPN before continuing. VIGIL has surfaced a warning above
            the window — close the affected apps if you cannot connect right now.
          </span>
        </section>
      )}

      <section className="card">
        <div className="card__head">
          <span className="eyebrow">RECENT ACTIVITY</span>
        </div>
        {activity.length === 0 ? (
          <p className="muted-block">
            No activity yet. Events will appear here when the VPN state changes
            or a protected service is detected.
          </p>
        ) : (
          <ul className="activity" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {activity.map((a) => {
              const { Icon, cls } = ACTIVITY_ICON[a.kind];
              return (
                <li key={a.id} className="activity-row">
                  <span className={`activity-row__icon activity-row__icon--${cls}`}>
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <div className="activity-row__main">
                    <span className="activity-row__title">{a.title}</span>
                    <span className="activity-row__time">
                      {formatAgo(new Date(a.at))}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
