import React, { useCallback, useEffect, useState } from "react";
import { checkV, clearVCache, type VState } from "./v";

type Props = { children: React.ReactNode };

export function VGate({ children }: Props) {
  const [state, setState] = useState<VState>({ status: "checking" });

  const runCheck = useCallback(async () => {
    setState({ status: "checking" });
    const result = await checkV();
    setState(result);
  }, []);

  const retry = useCallback(async () => {
    clearVCache();
    await runCheck();
  }, [runCheck]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  if (state.status === "ok") {
    return <>{children}</>;
  }

  if (state.status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          fontFamily: "system-ui, sans-serif",
          background: "#f5f5f5",
        }}
      >
        <div className="ant-spin ant-spin-lg" />
        <span style={{ color: "#666" }}>Checking…</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
        fontFamily: "system-ui, sans-serif",
        background: "#f5f5f5",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, color: "#1a1a1a" }}>
        Unable to continue
      </h1>
      <p style={{ margin: 0, color: "#555", maxWidth: 400 }}>
        {state.message ?? "Please try again later."}
      </p>
      <button
        type="button"
        onClick={retry}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
          color: "#fff",
          background: "#6ab04c",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}
