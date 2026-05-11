import { useState } from "react";
import {
  Bitcoin,
  Bot,
  Cloud,
  Code,
  Globe,
  LayoutGrid,
  MessageCircle,
  Plus,
  Send,
  Shield,
  Skull,
  Trash2,
  X,
} from "lucide-react";
import type {
  Behavior,
  ProtectedService,
  RiskLevel,
  ServiceKind,
} from "../types";
import { newServiceTemplate } from "../store";
import { CATALOG, isCatalogItemAdded } from "../catalog";
import { CatalogModal } from "../components/CatalogModal";

interface Props {
  services: ProtectedService[];
  onAdd: (svc: Omit<ProtectedService, "id">) => void;
  onUpdate: (id: string, patch: Partial<ProtectedService>) => void;
  onRemove: (id: string) => void;
}

function pickIcon(svc: { kind: ServiceKind; value: string }) {
  const v = svc.value.toLowerCase();
  if (svc.kind === "domain") {
    if (
      v.includes("binance") ||
      v.includes("coinbase") ||
      v.includes("kraken") ||
      v.includes("coin")
    ) {
      return { Icon: Bitcoin, tone: "warn" as const };
    }
    if (
      v.includes("openai") ||
      v.includes("anthropic") ||
      v.includes("claude") ||
      v.includes("gemini") ||
      v.includes("perplexity")
    ) {
      return { Icon: Bot, tone: "accent" as const };
    }
    return { Icon: Globe, tone: "accent" as const };
  }
  if (
    v.includes("chatgpt") ||
    v.includes("claude") ||
    v.includes("cursor") ||
    v.includes("perplexity") ||
    v.includes("lm studio") ||
    v.includes("ollama") ||
    v.includes("warp")
  ) {
    return { Icon: Bot, tone: "accent" as const };
  }
  if (v === "code" || v.includes("intellij") || v === "zed") {
    return { Icon: Code, tone: "accent" as const };
  }
  if (v.includes("telegram")) return { Icon: Send, tone: "accent" as const };
  if (
    v.includes("whatsapp") ||
    v.includes("signal") ||
    v.includes("discord") ||
    v.includes("slack") ||
    v.includes("message")
  ) {
    return { Icon: MessageCircle, tone: "ok" as const };
  }
  if (v.includes("dropbox") || v.includes("drive") || v.includes("onedrive")) {
    return { Icon: Cloud, tone: "accent" as const };
  }
  return { Icon: Shield, tone: "accent" as const };
}

export function ProtectedServices({
  services,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [draft, setDraft] = useState(newServiceTemplate());
  const [customOpen, setCustomOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.value.trim()) return;
    onAdd({ ...draft, value: draft.value.trim() });
    setDraft(newServiceTemplate());
    setCustomOpen(false);
  }

  const addedCount = CATALOG.filter((item) =>
    isCatalogItemAdded(item, services),
  ).length;

  return (
    <div className="screen">
      <header className="screen__head">
        <div className="screen__title">
          <h1>Protected services</h1>
          <p>
            {services.length === 0
              ? "Nothing watched yet — open the catalog to start"
              : `${services.length} watched · ${addedCount} from catalog`}
          </p>
        </div>
        <div className="screen__head-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setCustomOpen((v) => !v)}
            aria-expanded={customOpen}
          >
            {customOpen ? (
              <>
                <X size={14} strokeWidth={2.4} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={2.4} />
                Add custom
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setCatalogOpen(true)}
          >
            <LayoutGrid size={14} strokeWidth={2.4} />
            Add from catalog
          </button>
        </div>
      </header>

      {customOpen && (
        <section className="card form-card">
          <div className="eyebrow">CUSTOM SERVICE</div>
          {draft.kind === "domain" && (
            <p
              className="muted-block"
              style={{ margin: 0, color: "var(--warn)", fontSize: 12 }}
            >
              Heads up — domain protection is in development. VIGIL will save
              your entry but won't act on it until the browser extension ships.
            </p>
          )}
          <form className="form-row" onSubmit={submit}>
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
                <option value="domain">Domain (soon)</option>
              </select>
            </div>
            <div className="field field--grow">
              <label className="field__label">Process or domain</label>
              <input
                className="input input--mono"
                placeholder={
                  draft.kind === "app" ? "e.g. WhatsApp" : "e.g. openai.com"
                }
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                autoFocus
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
                <option value="block">Kill</option>
              </select>
            </div>
            <button type="submit" className="btn btn--primary">
              <Plus size={14} strokeWidth={2.4} />
              Add
            </button>
          </form>
        </section>
      )}

      <div className="watched-head">
        <div className="eyebrow">WATCHED SERVICES</div>
        {services.length > 0 && (
          <span className="muted">
            VIGIL warns when these run while VPN is off
          </span>
        )}
      </div>

      {services.length === 0 ? (
        <button
          type="button"
          className="empty empty--clickable"
          onClick={() => setCatalogOpen(true)}
        >
          <LayoutGrid size={20} strokeWidth={1.8} />
          <div>
            <strong>No protected services yet</strong>
            <p>
              Pick from the catalog of {CATALOG.length} common apps — ChatGPT,
              Claude, Cursor, Telegram and more.
            </p>
          </div>
          <span className="empty__cta">Open catalog →</span>
        </button>
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
                    {svc.behavior === "block" && (
                      <span
                        className="tag tag--kill"
                        title="VIGIL will kill this process if it launches while VPN is off"
                      >
                        <Skull size={10} strokeWidth={2.4} />
                        KILL
                      </span>
                    )}
                  </div>
                  <div className="svc-row__notes">
                    {svc.notes ?? matchHint}
                  </div>
                </div>
                <div className="svc-row__actions">
                  <select
                    className="select"
                    style={{ width: 110 }}
                    value={svc.behavior}
                    onChange={(e) =>
                      onUpdate(svc.id, {
                        behavior: e.target.value as Behavior,
                      })
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

      <CatalogModal
        open={catalogOpen}
        services={services}
        onAdd={onAdd}
        onClose={() => setCatalogOpen(false)}
      />
    </div>
  );
}
