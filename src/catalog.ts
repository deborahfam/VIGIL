import type { ProtectedService, RiskLevel, ServiceKind } from "./types";

export type CatalogCategory =
  | "ai"
  | "dev"
  | "messaging"
  | "crypto"
  | "cloud";

export interface CatalogItem {
  key: string;
  kind: ServiceKind;
  value: string;
  label: string;
  risk: RiskLevel;
  category: CatalogCategory;
  hint?: string;
}

export const CATALOG: CatalogItem[] = [
  // ─── AI / LLMs ─────────────────────────────────────────
  { key: "chatgpt", category: "ai", kind: "app", value: "ChatGPT", label: "ChatGPT", risk: "high", hint: "Sends prompts to OpenAI" },
  { key: "claude", category: "ai", kind: "app", value: "Claude", label: "Claude", risk: "high", hint: "Sends prompts to Anthropic" },
  { key: "cursor", category: "ai", kind: "app", value: "Cursor", label: "Cursor", risk: "high", hint: "Code + prompts to AI providers" },
  { key: "perplexity", category: "ai", kind: "app", value: "Perplexity", label: "Perplexity", risk: "high" },
  { key: "lmstudio", category: "ai", kind: "app", value: "LM Studio", label: "LM Studio", risk: "medium", hint: "Downloads + may call remote models" },
  { key: "ollama", category: "ai", kind: "app", value: "ollama", label: "Ollama", risk: "medium", hint: "Local but pulls models from registry" },
  { key: "warp", category: "ai", kind: "app", value: "Warp", label: "Warp Terminal", risk: "high", hint: "Terminal with AI features" },
  { key: "openai-domain", category: "ai", kind: "domain", value: "chat.openai.com", label: "chat.openai.com", risk: "high" },
  { key: "claude-domain", category: "ai", kind: "domain", value: "claude.ai", label: "claude.ai", risk: "high" },
  { key: "gemini-domain", category: "ai", kind: "domain", value: "gemini.google.com", label: "gemini.google.com", risk: "high" },

  // ─── Editors & dev tools ───────────────────────────────
  { key: "vscode", category: "dev", kind: "app", value: "Code", label: "VS Code", risk: "medium", hint: "Telemetry + Copilot traffic" },
  { key: "intellij", category: "dev", kind: "app", value: "IntelliJ", label: "IntelliJ / JetBrains", risk: "medium" },
  { key: "zed", category: "dev", kind: "app", value: "Zed", label: "Zed", risk: "medium" },

  // ─── Messaging ─────────────────────────────────────────
  { key: "telegram", category: "messaging", kind: "app", value: "Telegram", label: "Telegram", risk: "high" },
  { key: "whatsapp", category: "messaging", kind: "app", value: "WhatsApp", label: "WhatsApp", risk: "medium" },
  { key: "signal", category: "messaging", kind: "app", value: "Signal", label: "Signal", risk: "medium" },
  { key: "discord", category: "messaging", kind: "app", value: "Discord", label: "Discord", risk: "medium" },
  { key: "slack", category: "messaging", kind: "app", value: "Slack", label: "Slack", risk: "medium" },

  // ─── Crypto / finance ──────────────────────────────────
  { key: "binance", category: "crypto", kind: "domain", value: "binance.com", label: "binance.com", risk: "high" },
  { key: "coinbase", category: "crypto", kind: "domain", value: "coinbase.com", label: "coinbase.com", risk: "high" },
  { key: "kraken", category: "crypto", kind: "domain", value: "kraken.com", label: "kraken.com", risk: "high" },

  // ─── Cloud / files ─────────────────────────────────────
  { key: "dropbox", category: "cloud", kind: "app", value: "Dropbox", label: "Dropbox", risk: "medium" },
  { key: "gdrive", category: "cloud", kind: "app", value: "Google Drive", label: "Google Drive", risk: "medium" },
  { key: "onedrive", category: "cloud", kind: "app", value: "OneDrive", label: "OneDrive", risk: "medium" },
];

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  ai: "AI / LLMs",
  dev: "Editors & dev tools",
  messaging: "Messaging",
  crypto: "Crypto / finance",
  cloud: "Cloud & files",
};

export const CATEGORY_ORDER: CatalogCategory[] = [
  "ai",
  "dev",
  "messaging",
  "crypto",
  "cloud",
];

export function isCatalogItemAdded(
  item: CatalogItem,
  services: ProtectedService[],
): boolean {
  const v = item.value.toLowerCase();
  return services.some(
    (s) => s.kind === item.kind && s.value.toLowerCase() === v,
  );
}

export function catalogItemToService(
  item: CatalogItem,
): Omit<ProtectedService, "id"> {
  return {
    kind: item.kind,
    value: item.value,
    risk: item.risk,
    behavior: "warn",
    notes: item.hint,
  };
}
