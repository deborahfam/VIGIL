interface Props {
  connected: boolean;
  label?: string;
}

export function StatusPill({ connected, label }: Props) {
  return (
    <span className={`pill pill--${connected ? "ok" : "warn"}`}>
      <span className="pill__dot" aria-hidden />
      {label ?? (connected ? "VPN connected" : "VPN off")}
    </span>
  );
}
