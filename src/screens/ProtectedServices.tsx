import { useState } from "react";
import {
  Bitcoin,
  Globe,
  MessageCircle,
  Plus,
  Send,
  Shield,
  Trash2,
} from "lucide-react";
import type { ProtectedService, RiskLevel, ServiceKind, Behavior } from "../types";
import { newServiceTemplate } from "../store";

interface Props {
  services: ProtectedService[];
  onAdd: (svc: Omit<ProtectedService, "id">) => void;
  onUpdate: (id: string, patch: Partial<ProtectedService>) => void;
  onRemove: (id: string) => void;
}

function pickIcon(svc: ProtectedService) {
  const v = svc.value.toLowerCase();
  if (svc.kind === "domain") {
    if (v.includes("binance") || v.includes("coin")) return { Icon: Bitcoin, tone: "warn" as const };
    return { Icon: Globe, tone: "accent" as const };
  }
  if (v.includes("telegram")) return { Icon: Send, tone: "accent" as const };
  if (v.includes("whatsapp") || v.includes("signal") || v.includes("message")) {
    return { Icon: MessageCircle, tone: "ok" as const };
  }
  return { Icon: Shield, tone: "accent" as const };
}

export function ProtectedServices({ services, onAdd, onUpdate, onRemove }: Props) {
  const [draft, setDraft] = useState(newServiceTemplate());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.value.trim()) return;
    onAdd({ ...draft, value: draft.value.trim() });
    setDraft(newServiceTemplate());
  }

  const triggering = 0;

  return (
    <div className="screen">
      <header className="screen__head">
        <div className="screen__title">
          <h1>Protected services</h1>
          <p>
            {services.length} services watched — {triggering} currently triggering
            warnings
          </p>
        </div>
        <button type="submit" form="add-service-form" className="btn btn--primary">
          <Plus size={14} strokeWidth={2.4} />
          Add service
        </button>
      </header>

      <section className="card form-card">
        <div className="eyebrow">NEW SERVICE</div>
        <form id="add-service-form" className="form-row" onSubmit={submit}>
          <div className="field field--narrow">
            <label className="field__label">Kind</label>
            <select
              className="select"
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value as ServiceKind })
              }
            >
              <option value="app">App</option>
              <option value="domain">Domain</option>
            </select>
          </div>
          <div className="field field--grow">
            <label className="field__label">Process or domain</label>
            <input
              className="input input--mono"
              placeholder={
                draft.kind === "app"
                  ? "e.g. WhatsApp"
                  : "e.g. openai.com"
              }
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            />
          </div>
          <div className="field field--narrow">
            <label className="field__label">Risk</label>
            <select
              className="select"
              value={draft.risk}
              onChange={(e) =>
                setDraft({ ...draft, risk: e.target.value as RiskLevel })
              }
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="field field--narrow">
            <label className="field__label">Behavior</label>
            <select
              className="select"
              value={draft.behavior}
              onChange={(e) =>
                setDraft({ ...draft, behavior: e.target.value as Behavior })
              }
            >
              <option value="warn">Warn</option>
              <option value="block">Block</option>
            </select>
          </div>
        </form>
      </section>

      <div className="eyebrow">WATCHED SERVICES</div>

      {services.length === 0 ? (
        <p className="empty">
          No protected services yet. Add an app process name or a domain that
          should only be used while the VPN is on.
        </p>
      ) : (
        <ul className="svc-list">
          {services.map((svc) => {
            const { Icon, tone } = pickIcon(svc);
            const matchHint =
              svc.kind === "app"
                ? `Process match: ${svc.value.toLowerCase()}`
                : "Domain match — needs browser extension to enforce";
            return (
              <li key={svc.id} className="svc-row">
                <div className={`svc-row__icon svc-row__icon--${tone}`}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="svc-row__main">
                  <div className="svc-row__title">
                    <span className="svc-row__value">{svc.value}</span>
                    <span className="tag">{svc.kind}</span>
                    <span className={`risk risk--${svc.risk}`}>
                      {svc.risk.toUpperCase()}
                    </span>
                  </div>
                  <div className="svc-row__notes">{matchHint}</div>
                </div>
                <div className="svc-row__actions">
                  <select
                    className="select"
                    style={{ width: 110 }}
                    value={svc.behavior}
                    onChange={(e) =>
                      onUpdate(svc.id, { behavior: e.target.value as Behavior })
                    }
                  >
                    <option value="warn">Warn</option>
                    <option value="block">Block</option>
                  </select>
                  <button
                    className="btn btn--icon"
                    aria-label={`Remove ${svc.value}`}
                    onClick={() => onRemove(svc.id)}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
