import { useState } from "react";
import { ChevronRight, Plus, X, Coffee, Heart } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Settings, VpnStatus } from "../types";

const COFFEE_URL = "https://www.buymeacoffee.com/dbyta";

interface Props {
  settings: Settings;
  vpn: VpnStatus | null;
  onUpdate: (patch: Partial<Settings>) => void;
}

export function SettingsScreen({ settings, vpn, onUpdate }: Props) {
  const [trustedDraft, setTrustedDraft] = useState("");
  const [detectedOpen, setDetectedOpen] = useState(false);

  function addTrusted() {
    const name = trustedDraft.trim();
    if (!name) return;
    if (settings.trustedInterfaces.includes(name)) return;
    onUpdate({ trustedInterfaces: [...settings.trustedInterfaces, name] });
    setTrustedDraft("");
  }

  function removeTrusted(name: string) {
    onUpdate({
      trustedInterfaces: settings.trustedInterfaces.filter((n) => n !== name),
    });
  }

  return (
    <div className="screen">
      <header className="screen__head">
        <div className="screen__title">
          <h1>Settings</h1>
          <p>Configure how VIGIL detects, warns, and trusts your network</p>
        </div>
      </header>

      <section className="card settings-card">
        <div className="eyebrow">BEHAVIOR</div>
        <Toggle
          name="Strict mode"
          hint='Hide the "Open anyway" button on warnings.'
          on={settings.strictMode}
          onChange={(v) => onUpdate({ strictMode: v })}
        />
        <Toggle
          name="Public IP check"
          hint="Periodically fetch your public IP for the dashboard."
          on={settings.publicIpCheck}
          onChange={(v) => onUpdate({ publicIpCheck: v })}
        />
        <Toggle
          name="Reminder notifications"
          hint="If you 'Open anyway', send a system notification 2 min later if VPN is still off."
          on={settings.remindersEnabled}
          onChange={(v) => onUpdate({ remindersEnabled: v })}
        />
        <div className="setting">
          <div className="setting__label">
            <span className="setting__name">VPN status refresh</span>
            <span className="setting__hint">
              How often to refresh VPN status and public IP. App launches are
              detected instantly regardless of this setting.
            </span>
          </div>
          <select
            className="select"
            style={{ width: 130 }}
            value={settings.pollIntervalSec}
            onChange={(e) =>
              onUpdate({ pollIntervalSec: Number(e.target.value) })
            }
          >
            <option value={2}>2 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
          </select>
        </div>
      </section>

      <section className="card">
        <div className="card__head">
          <span className="eyebrow">TRUSTED VPN INTERFACES</span>
          <span className="count-badge">
            {settings.trustedInterfaces.length} added
          </span>
        </div>
        <p className="muted-block">
          If your VPN uses an interface name that doesn't match the built-in
          patterns (tun, utun, wg, ppp, ipsec…), add it here so VIGIL recognizes
          the connection as protected.
        </p>
        <div className="form-row">
          <div className="field field--grow">
            <input
              className="input input--mono"
              placeholder="Interface name (e.g. ppp0)"
              value={trustedDraft}
              onChange={(e) => setTrustedDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTrusted();
                }
              }}
            />
          </div>
          <button className="btn btn--primary" onClick={addTrusted}>
            <Plus size={14} strokeWidth={2.4} />
            Add
          </button>
        </div>
        {settings.trustedInterfaces.length > 0 && (
          <div className="chip-row">
            {settings.trustedInterfaces.map((name) => (
              <span key={name} className="chip chip--accent">
                {name}
                <button
                  className="chip__close"
                  onClick={() => removeTrusted(name)}
                  aria-label={`Remove ${name}`}
                >
                  <X size={12} strokeWidth={2.4} />
                </button>
              </span>
            ))}
          </div>
        )}
        {vpn && vpn.all_interfaces.length > 0 && (
          <>
            <button
              className="detected"
              aria-expanded={detectedOpen}
              onClick={() => setDetectedOpen((v) => !v)}
            >
              <span className="detected__caret">
                <ChevronRight size={12} strokeWidth={2.4} />
              </span>
              <span className="detected__label">
                Detected interfaces ({vpn.all_interfaces.length})
              </span>
              {!detectedOpen && (
                <span className="detected__list">
                  {vpn.all_interfaces.slice(0, 5).join(" ")}
                </span>
              )}
            </button>
            {detectedOpen && (
              <div className="detected-expanded">
                {vpn.all_interfaces.map((name) => (
                  <span key={name} className="chip">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="card support-card">
        <div className="support-card__head">
          <span className="support-card__mark" aria-hidden>
            <Heart size={14} strokeWidth={2.4} fill="currentColor" />
          </span>
          <div className="support-card__intro">
            <span className="eyebrow">SUPPORT</span>
            <h3 className="support-card__title">Made by dbyta</h3>
          </div>
        </div>
        <p className="muted-block">
          VIGIL is free and built solo. If it saved you from leaking traffic —
          or you just want to fuel a late-night commit — a coffee goes a long
          way.
        </p>
        <div className="support-card__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openUrl(COFFEE_URL).catch(() => {})}
          >
            <Coffee size={14} strokeWidth={2.4} />
            Buy me a coffee
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({
  name,
  hint,
  on,
  onChange,
}: {
  name: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting">
      <div className="setting__label">
        <span className="setting__name">{name}</span>
        <span className="setting__hint">{hint}</span>
      </div>
      <label className={`toggle ${on ? "toggle--on" : ""}`}>
        <input
          className="toggle__input"
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={name}
        />
      </label>
    </div>
  );
}
