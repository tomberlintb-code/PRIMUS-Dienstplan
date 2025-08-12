// src/app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// --- Helpers: Berlin-Zeit & Begrüßung ---
function getBerlinHour(): number {
  const parts = new Intl.DateTimeFormat("de-DE", {
    hour: "numeric",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).formatToParts(new Date());
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(hourPart, 10);
}
function getGreeting(): string {
  const h = getBerlinHour();
  if (h >= 5 && h < 10) return "Guten Morgen";
  if (h >= 10 && h < 12) return "Guten Vormittag";
  if (h >= 12 && h < 17) return "Guten Tag";
  if (h >= 17 && h < 22) return "Guten Abend";
  return "Gute Nacht";
}

// Rundes echtes Logo aus /public
function PrimusLogo({ size = 84 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      <Image
        src="/logo.png"
        alt="PRIMUS Logo"
        width={size}
        height={size}
        style={{ objectFit: "cover", display: "block" }}
        priority
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // UI-States
  const [greeting, setGreeting] = useState<string>(getGreeting());
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Refs für Überschrift-Positionierung
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [headingTop, setHeadingTop] = useState<number>(60); // Fallback

  // Beim Aufruf der Login-Seite: Sitzung beenden + nur Tab-Persistenz
  useEffect(() => {
    setPersistence(auth, browserSessionPersistence)
      .catch(() => {})
      .finally(() => {
        signOut(auth).finally(() => setResetDone(true));
      });
  }, []);

  // Begrüßung minütlich aktualisieren
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Whitelist-Check
  async function ensureWhitelisted(user: User) {
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await signOut(auth);
        setError(
          "Kein Zugriff: Dein Account ist nicht freigeschaltet. Bitte an die Disposition/Admin wenden."
        );
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      await signOut(auth);
      setError("Zugriffsprüfung fehlgeschlagen. Bitte später erneut versuchen.");
      setLoading(false);
    }
  }

  // Auth-Listener
  useEffect(() => {
    if (!resetDone) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        ensureWhitelisted(user);
      }
    });
    return () => unsub();
  }, [resetDone]);

  // Formular
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      // Weiterleitung via onAuthStateChanged
    } catch {
      setError("E-Mail oder Passwort falsch.");
      setLoading(false);
    }
  }

  // Überschrift exakt mittig zwischen oberem Rand und Kartenoberkante positionieren
  const computeHeadingTop = useMemo(
    () => () => {
      const cont = containerRef.current;
      const card = cardRef.current;
      if (!cont || !card) return;
      const contRect = cont.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const distanceTopToCardTop = cardRect.top - contRect.top;
      const middle = distanceTopToCardTop / 2; // halber Weg
      // kleiner Mindestabstand für sehr kleine Screens
      setHeadingTop(Math.max(32, middle));
    },
    []
  );

  useEffect(() => {
    computeHeadingTop();
    const onResize = () => computeHeadingTop();
    window.addEventListener("resize", onResize, { passive: true });
    // Nach kleinem Delay noch einmal berechnen (Fonts/Images)
    const t = window.setTimeout(computeHeadingTop, 50);
    const t2 = window.setTimeout(computeHeadingTop, 200);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [computeHeadingTop, resetDone, greeting, email, pw]);

  // Während des Logout-Resets
  if (!resetDone) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #00359411, #e1060011)",
          color: "#0b1a2b",
        }}
      >
        <div>Vorbereiten…</div>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "linear-gradient(135deg, #0b3a92, #0a2f76)",
      }}
    >
      {/* Überschrift exakt mittig zwischen Top & Karte */}
      <h1
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: headingTop,
          margin: 0,
          color: "#fff",
          fontWeight: 800,
          fontSize: "clamp(20px, 3.2vw, 36px)",
          letterSpacing: 0.2,
          textAlign: "center",
          textShadow: "0 3px 10px rgba(0,0,0,0.35)",
          pointerEvents: "none",
        }}
      >
        Einsatz- und Urlaubsplanung
      </h1>

      {/* Login-Karte */}
      <div
        ref={cardRef}
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)",
          width: "100%",
          maxWidth: 440,
        }}
      >
        <PrimusLogo size={90} />

        <h2
          style={{
            textAlign: "center",
            marginTop: "1rem",
            marginBottom: "0.25rem",
            color: "#0b1a2b",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          {greeting}
        </h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: "1.25rem",
            color: "#334155",
          }}
        >
          Bitte melde dich an, um fortzufahren.
        </p>

        <form onSubmit={handleLogin} noValidate>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.9rem 1rem",
              marginBottom: "0.9rem",
              borderRadius: "0.75rem",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: 14,
              background: "#f1f5f9",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#003594")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.9rem 1rem",
              marginBottom: "1rem",
              borderRadius: "0.75rem",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: 14,
              background: "#f1f5f9",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#003594")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            autoComplete="current-password"
          />

          {error && (
            <div
              role="alert"
              style={{
                background: "#fff1f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.9rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#003594",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 14px rgba(0,53,148,0.35)",
            }}
          >
            {loading ? "Prüfe Berechtigung…" : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
