"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import Image from "next/image";

type Role = "user" | "admin" | "superadmin";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = searchParams.get("r") || "/dashboard";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await fetchAndPersistRole(user.uid);
          if (role !== "none") {
            router.replace(redirectTarget);
          } else {
            setError("Keine gültige Rolle hinterlegt.");
          }
        } catch (e) {
          console.error("🔥 Fehler beim Rollenabruf:", e);
          setError("Rollenprüfung fehlgeschlagen.");
        }
      }
    });
    return () => unsub();
  }, [redirectTarget, router]);

  async function fetchAndPersistRole(uid: string): Promise<Role | "none"> {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const role = (snap.exists() ? (snap.data().role as Role) : "none") || "none";

      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      return role;
    } catch (err) {
      console.error("⚠️ fetchAndPersistRole Error:", err);
      return "none";
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    console.log("🔑 Login-Versuch mit:", email, password);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log("✅ Firebase Login erfolgreich:", cred.user.uid);

      const role = await fetchAndPersistRole(cred.user.uid);
      if (role === "none") {
        setError("Keine gültige Rolle hinterlegt.");
        await signOut(auth);
        return;
      }

      router.replace(redirectTarget);
    } catch (err: any) {
      console.error("❌ Login fehlgeschlagen:", err.code, err.message);
      setError(`Login fehlgeschlagen: ${err.code || "unbekannt"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#093d9e",
        color: "white",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Image
            src="/logo.png"
            alt="PRIMUS Logo"
            width={100}
            height={100}
            priority
          />
        </div>

        <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>PRIMUS – Login</h1>

        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, color: "#111" }}
        />

        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, color: "#111" }}
        />

        {error && (
          <div style={{ marginBottom: "1rem", color: "#ffcccc" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            background: busy ? "#7c93d6" : "white",
            color: "#093d9e",
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </main>
  );
}
