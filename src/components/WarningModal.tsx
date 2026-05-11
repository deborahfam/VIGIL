import { ShieldAlert, ShieldCheck, Skull } from "lucide-react";
import type { ActiveWarning } from "../types";

interface Props {
  warning: ActiveWarning | null;
  strictMode: boolean;
  onDismiss: () => void;
  onOpenAnyway: () => void;
}

function formatAgo(ts: number): string {
  const sec = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec} second${sec === 1 ? "" : "s"} ago`;
  const min = Math.round(sec / 60);
  return `${min} minute${min === 1 ? "" : "s"} ago`;
}

export function WarningModal({ warning, strictMode, onDismiss, onOpenAnyway }: Props) {
  if (!warning) return null;
  const { service, detectedAt } = warning;
  const isKilled = service.behavior === "block";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="warn-title">
      <div className={`modal ${isKilled ? "modal--killed" : ""}`}>
        <div className="modal__icon" aria-hidden>
          {isKilled ? (
            <Skull size={28} strokeWidth={2} />
          ) : (
            <ShieldAlert size={28} strokeWidth={2} />
          )}
        </div>
        <div>
          <h2 id="warn-title">
            {isKilled ? `VIGIL stopped ${service.value}` : "VPN is off"}
          </h2>
          <p className="modal__lede">
            {isKilled ? (
              <>
                <strong>{service.value}</strong> tried to run while your VPN
                was off. VIGIL killed the process before any traffic could
                leave your machine. Connect your VPN before reopening.
              </>
            ) : (
              "You are about to use a protected service. This may expose your real connection and put your account at risk."
            )}
          </p>
        </div>
        <dl className="modal__meta">
          <div className="modal__meta-row">
            <dt>Service</dt>
            <dd>
              <code>{service.value}</code>
              <span className="tag">{service.kind}</span>
            </dd>
          </div>
          <div className="modal__meta-row">
            <dt>Risk</dt>
            <dd>
              <span className={`risk risk--${service.risk}`}>{service.risk.toUpperCase()}</span>
            </dd>
          </div>
          <div className="modal__meta-row">
            <dt>{isKilled ? "Killed" : "Detected"}</dt>
            <dd>{formatAgo(detectedAt)}</dd>
          </div>
        </dl>
        <div className="modal__actions">
          {isKilled ? (
            <button className="btn btn--primary" onClick={onDismiss}>
              <ShieldCheck size={14} strokeWidth={2.2} />
              Got it
            </button>
          ) : (
            <>
              <button className="btn btn--ghost" onClick={onDismiss}>
                Dismiss
              </button>
              {!strictMode && (
                <button className="btn btn--danger" onClick={onOpenAnyway}>
                  Open anyway
                </button>
              )}
              <button className="btn btn--primary" onClick={onDismiss}>
                <ShieldCheck size={14} strokeWidth={2.2} />
                I'll connect VPN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
