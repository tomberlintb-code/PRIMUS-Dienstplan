"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "../../lib/useUserRole";

const ALLOWED: Array<"admin" | "disp"> = ["admin", "disp"];

export default function DispositionPage() {
  const router = useRouter();
  const { user, role, loading } = useUserRole();
  const canWrite = role === "admin" || role === "disp";

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/");
      else if (!ALLOWED.includes(role)) router.replace("/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading || !user || !ALLOWED.includes(role)) {
    return <main style={center}>Lade…</main>;
  }

  return (
    <main style={wrap}>
      <Header title="Disposition" role={role} canWrite={canWrite} />
      <Card>
        <p style={lead}>Platzhalter – Disposition folgt.</p>
        <p style={text}>
          Hier kommen später Einsatzplanung, Fahrzeug-/Team-Zuordnung, Live-Übersicht usw.
        </p>
        <Actions canWrite={canWrite} />
      </Card>
    </main>
  );
}

/* ----- UI-Helfer ----- */
const wrap: React.CSSProperties = { padding: 24, maxWidth: 980, margin: "0 auto" };
const center: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center" };
const lead: React.CSSProperties = { fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" };
const text: React.CSSProperties = { color: "#475569", marginTop: 8 };
function Header({ title, role, canWrite }: { title: string; role: string; canWrite: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <h1 style={{ color: "#0b1a2b", margin: 0 }}>{title}</h1>
      <span style={{ color: "#64748b" }}>
        Rolle: <strong>{role}</strong> · {canWrite ? "Bearbeiten erlaubt" : "Nur lesen"}
      </span>
    </div>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 16, background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", padding: 16 }}>
      {children}
    </section>
  );
}
function Actions({ canWrite }: { canWrite: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <button disabled={!canWrite} style={btn(canWrite, "#0B5ED7")}>Anlegen</button>
      <button disabled={!canWrite} style={btn(canWrite, "#0A7D4F")}>Bearbeiten</button>
      <button disabled={!canWrite} style={btn(canWrite, "#ef4444")}>Löschen</button>
      {!canWrite && <span style={{ color: "#64748b", marginLeft: 8 }}>Lesemodus für Personal</span>}
    </div>
  );
}
function btn(enabled: boolean, color: string): React.CSSProperties {
  return {
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    background: enabled ? color : "#cbd5e1",
    color: enabled ? "#fff" : "#475569",
    fontWeight: 700,
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.9,
  };
}
