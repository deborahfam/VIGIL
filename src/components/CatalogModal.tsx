import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bitcoin,
  Bot,
  Check,
  Cloud,
  Code,
  Globe,
  MessageCircle,
  Plus,
  Search,
  Send,
  Shield,
  X,
} from "lucide-react";
import type { ProtectedService, RiskLevel, ServiceKind } from "../types";
import {
  CATALOG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  catalogItemToService,
  isCatalogItemAdded,
  type CatalogCategory,
  type CatalogItem,
} from "../catalog";

interface Props {
  open: boolean;
  services: ProtectedService[];
  onAdd: (svc: Omit<ProtectedService, "id">) => void;
  onClose: () => void;
}

const RISK_LETTER: Record<RiskLevel, string> = {
  high: "H",
  medium: "M",
  low: "L",
};

function pickIcon(kind: ServiceKind, value: string) {
  const v = value.toLowerCase();
  if (kind === "domain") {
    if (
      v.includes("binance") ||
      v.includes("coinbase") ||
      v.includes("kraken") ||
      v.includes("coin")
    ) {
      return Bitcoin;
    }
    if (
      v.includes("openai") ||
      v.includes("anthropic") ||
      v.includes("claude") ||
      v.includes("gemini") ||
      v.includes("perplexity")
    ) {
      return Bot;
    }
    return Globe;
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
    return Bot;
  }
  if (v === "code" || v.includes("intellij") || v === "zed") return Code;
  if (v.includes("telegram")) return Send;
  if (
    v.includes("whatsapp") ||
    v.includes("signal") ||
    v.includes("discord") ||
    v.includes("slack")
  ) {
    return MessageCircle;
  }
  if (v.includes("dropbox") || v.includes("drive") || v.includes("onedrive")) {
    return Cloud;
  }
  return Shield;
}

function tileToneClass(item: CatalogItem): string {
  if (item.kind === "domain") return "catalog-tile--domain";
  if (item.category === "messaging" && item.key !== "telegram") {
    return "catalog-tile--messaging-secure";
  }
  return "";
}

export function CatalogModal({ open, services, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const out: Record<CatalogCategory, CatalogItem[]> = {
      ai: [],
      dev: [],
      messaging: [],
      cloud: [],
    };
    for (const item of filtered) out[item.category].push(item);
    return out;
  }, [filtered]);

  const addedCount = CATALOG.filter((item) =>
    isCatalogItemAdded(item, services),
  ).length;

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal modal--catalog">
        <header className="catalog-modal__head">
          <div>
            <div className="eyebrow" style={{ color: "var(--accent)" }}>
              ADD FROM CATALOG
            </div>
            <h2 id="catalog-title" className="catalog-modal__title">
              Pick apps to protect
            </h2>
          </div>
          <div className="catalog-modal__head-right">
            <span className="catalog-counter">
              <span className="catalog-counter__num">{addedCount}</span>
              <span>/ {CATALOG.length} ADDED</span>
            </span>
            <button
              type="button"
              className="btn btn--icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        </header>

        <label className="catalog-search">
          <Search size={14} strokeWidth={2.4} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps…"
          />
          {query && (
            <button
              type="button"
              className="link"
              onClick={() => setQuery("")}
            >
              CLEAR
            </button>
          )}
        </label>

        <div className="catalog-modal__notice">
          <strong>Apps only for now.</strong> Web URL protection (chat.openai.com,
          binance.com, …) is in development and will ship as a separate browser
          extension.
        </div>

        <div className="catalog-modal__body">
          {filtered.length === 0 ? (
            <p className="catalog-empty">
              No matches for "{query}". Close the modal and use "Add custom" to
              create your own.
            </p>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              return (
                <div key={cat} className="catalog-group">
                  <div className="catalog-group__title">
                    {CATEGORY_LABELS[cat]}
                  </div>
                  <div className="catalog-grid">
                    {items.map((item) => {
                      const added = isCatalogItemAdded(item, services);
                      const Icon = pickIcon(item.kind, item.value);
                      const tone = tileToneClass(item);
                      const isDomain = item.kind === "domain";
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={[
                            "catalog-tile",
                            tone,
                            isDomain ? "catalog-tile--domain" : "",
                            added ? "catalog-tile--added" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          disabled={added}
                          onClick={() => {
                            if (added) return;
                            onAdd(catalogItemToService(item));
                          }}
                          title={item.hint ?? item.label}
                        >
                          <span className="catalog-tile__icon">
                            <Icon size={16} strokeWidth={2} />
                          </span>
                          <span className="catalog-tile__body">
                            <span className="catalog-tile__label">
                              {item.label}
                            </span>
                            <span className="catalog-tile__kind">
                              {item.kind}
                              {added && " · added"}
                            </span>
                          </span>
                          <span
                            className={`catalog-tile__risk catalog-tile__risk--${item.risk}`}
                            aria-label={`${item.risk} risk`}
                          >
                            {RISK_LETTER[item.risk]}
                          </span>
                          <span className="catalog-tile__plus" aria-hidden>
                            {added ? (
                              <Check size={12} strokeWidth={2.8} />
                            ) : (
                              <Plus size={12} strokeWidth={2.8} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="catalog-modal__foot">
          <span className="muted-block" style={{ margin: 0 }}>
            Press <kbd className="kbd">Esc</kbd> to close. Changes save
            automatically.
          </span>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
