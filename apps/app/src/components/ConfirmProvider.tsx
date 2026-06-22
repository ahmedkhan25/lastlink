import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Logo } from "@lastlink/ui";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) => new Promise<boolean>((resolve) => setState({ opts, resolve })),
    [],
  );

  const close = useCallback(
    (result: boolean) => {
      setState((s) => { s?.resolve(result); return null; });
    },
    [],
  );

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  const opts = state?.opts;
  const danger = opts?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div
          onClick={() => close(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(31,24,20,0.45)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ width: 440, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-4)", boxShadow: "var(--shadow-3)", padding: 32 }}
          >
            <div style={{ marginBottom: 18 }}><Logo size={24} /></div>
            <h2 className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{opts.title}</h2>
            {opts.message && <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 28px" }}>{opts.message}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="ll-btn secondary" onClick={() => close(false)}>{opts.cancelLabel ?? "Cancel"}</button>
              <button
                className="ll-btn"
                onClick={() => close(true)}
                style={danger ? { background: "var(--err)", color: "white" } : undefined}
              >
                {opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
