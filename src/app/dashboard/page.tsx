// src/app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";

type Role = "admin" | "disp" | "personal";

type Btn = {
  key: string;
  label: string;
  route?: string;
  onClick?: () => Promise<void> | void;
  color: string;
  icon: JSX.Element;
  angleDeg: number; // 0° = rechts, 90° = unten
  visibleFor: Role[];
};

type Geo = {
  cx: number;
  cy: number;
  targets: { x: number; y: number; len: number }[];
  topMostY: number;
};

function getBerlinHour(): number {
  const parts = new Intl.DateTimeFormat("de-DE", {
    hour: "numeric",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).formatToParts(new Date());
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(hourPart, 10);
}
function getGreetingByDaypart(): string {
  const h = getBerlinHour();
  if (h >= 5 && h < 10) return "Guten Morgen";
  if (h >= 10 && h < 12) return "Guten Vormittag";
  if (h >= 12 && h < 17) return "Guten Tag";
  if (h >= 17 && h < 22) return "Guten Abend";
  return "Gute Nacht";
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "1";

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rolle + Name
  const [role, setRole] = useState<Role>("personal");
  const [displayName, setDisplayName] = useState<string>("");

  // Geometrie/Animation
  const [geo, setGeo] = useState<Geo | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [animateOnce, setAnimateOnce] = useState(false);
  const [greetTop, setGreetTop] = useState<number>(48);

  // Hover/Klick
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Voller Button-Katalog (Sichtbarkeit pro Rolle)
  const allButtons: Btn[] = useMemo(
    () => [
      {
        key: "dienst",
        label: "Dienst/Urlaub",
        route: "/dienst-urlaub",
        color: "#0B5ED7",
        icon: <span aria-hidden>📅</span>,
        angleDeg: -30,
        visibleFor: ["personal", "disp", "admin"], // personal sieht diesen
      },
      {
        key: "dispo",
        label: "Disposition",
        route: "/disposition",
        color: "#8B5CF6",
        icon: <span aria-hidden>🗂️</span>,
        angleDeg: 140,
        visibleFor: ["disp", "admin"],
      },
      {
        key: "personal",
        label: "Personalabteilung",
        route: "/personal",
        color: "#E10600",
        icon: <span aria-hidden>👥</span>,
        angleDeg: -100,
        visibleFor: ["disp", "admin"],
      },
      {
        key: "konfig",
        label: "Konfiguration",
        route: "/konfiguration",
        color: "#0A7D4F",
        icon: <span aria-hidden>⚙️</span>,
        angleDeg: 20,
        visibleFor: ["admin"],
      },
      {
        key: "archiv",
        label: "Archiv",
        route: "/archiv",
        color: "#F59E0B",
        icon: <span aria-hidden>📂</span>,
        angleDeg: 75,
        visibleFor: ["disp", "admin"],
      },
      {
        key: "logout",
        label: "Logout",
        color: "#111827",
        icon: <span aria-hidden>🚪</span>,
        angleDeg: -155,
        visibleFor: ["personal", "disp", "admin"], // Logout für alle Rollen sichtbar
        onClick: async () => {
          await signOut(auth);
          router.replace("/");
        },
      },
    ],
    [router]
  );

  // Gefilterte Buttons nach Rolle
  const buttons = useMemo(
    () => allButtons.filter((b) => b.visibleFor.includes(role)),
    [allButtons, role]
  );

  // Einmalige Linien-Animation pro Session
  useEffect(() => {
    const shown = typeof window !== "undefined" && sessionStorage.getItem("brainstormShown") === "1";
    setAnimateOnce(!shown);
  }, []);

  // Auth + Userdaten (Name + Rolle) laden
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.replace("/");
        return;
      }

      let name = "";
      let roleValue: Role | null = null;

      // 1) users/{uid}
      const uidRef = doc(db, "users", user.uid);
      const uidSnap = await getDoc(uidRef);
      if (uidSnap.exists()) {
        const d = uidSnap.data() as any;
        name = d.displayName || d.name || d.vorname || "";
        const r = (d.role || "").toString().toLowerCase();
        if (r === "admin" || r === "disp" || r === "personal") roleValue = r as Role;
      }

      // 2) Fallback per E-Mail
      if ((!name || !roleValue) && user.email) {
        const q = query(collection(db, "users"), where("email", "==", user.email), limit(1));
        const qs = await getDocs(q);
        if (!qs.empty) {
          const d = qs.docs[0].data() as any;
          if (!name) name = d.displayName || d.name || d.vorname || "";
          if (!roleValue) {
            const r = (d.role || "").toString().toLowerCase();
            if (r === "admin" || r === "disp" || r === "personal") roleValue = r as Role;
          }
        }
      }

      setDisplayName(name || "");
      setRole(roleValue ?? "personal");
    });
    return () => unsub();
  }, [router]);

  // Geometrie berechnen (Logo Mitte, sichtbare Buttons im Kreis)
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    const recompute = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      const cx = w / 2;
      const cy = h / 2; // Logo exakt mittig
      const radius = Math.min(w, h) * 0.30;

      const targets = buttons.map((b) => {
        const rad = (b.angleDeg * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        const len = Math.hypot(x - cx, y - cy);
        return { x, y, len };
      });

      const topMostY = targets.reduce((min, t) => Math.min(min, t.y), Number.POSITIVE_INFINITY);
      setGeo({ cx, cy, targets, topMostY });

      // Begrüßung mittig zwischen Seitenoberkante und oberstem sichtbaren Button
      const mid = topMostY / 2;
      setGreetTop(Math.max(24, Math.min(topMostY - 24, mid)));
    };

    recompute();
    const onResize = () => recompute();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [buttons]);

  // Linien nacheinander – nur beim ersten Laden
  useEffect(() => {
    if (!geo) return;

    if (!animateOnce) {
      setRevealedCount(buttons.length);
      return;
    }

    setRevealedCount(0);
    let i = 0;
    const stepMs = 350;
    const timer = window.setInterval(() => {
      i += 1;
      setRevealedCount(i);
      if (i >= buttons.length) {
        window.clearInterval(timer);
        sessionStorage.setItem("brainstormShown", "1");
      }
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [geo, animateOnce, buttons.length]);

  const dayGreeting = getGreetingByDaypart();
  const fullGreeting =
    displayName && displayName.trim().length > 0
      ? `${dayGreeting}, ${displayName}!`
      : dayGreeting;

  // Klick: andere Buttons ausblenden, dann navigieren
  function handleClick(i: number, b: Btn) {
    if (selectedIdx !== null) return;
    setSelectedIdx(i);
    const go = async () => {
      if (b.onClick) await b.onClick();
      else if (b.route) router.push(b.route);
    };
    window.setTimeout(go, 420);
  }

  // ---- NEU: Render erst, wenn Geo und Buttons synchron sind ----
  const geoReady = !!geo && geo.targets.length === buttons.length;

  return (
    <main
      ref={containerRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0b3a92, #0a2f76)",
        overflow: "hidden",
      }}
    >
      {/* SVG: weiße Glow-Linien + dezente Funken (nur beim ersten Laden) */}
      {geoReady && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <defs>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {geo!.targets.map((t, i) => {
            const dash = Math.max(t.len, 1);
            const isHoveredDim = hoverIdx !== null && hoverIdx !== i && selectedIdx === null;
            const lineOpacity =
              selectedIdx === null
                ? (isHoveredDim ? 0.25 : 0.9)
                : (selectedIdx === i ? 0.9 : 0);

            return (
              <g key={i}>
                <line
                  x1={geo!.cx}
                  y1={geo!.cy}
                  x2={t.x}
                  y2={t.y}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  style={{
                    strokeDasharray: dash,
                    strokeDashoffset: i < revealedCount ? 0 : dash,
                    opacity: lineOpacity,
                    transition: "opacity 180ms ease, stroke-dashoffset 360ms ease-out",
                  }}
                />
                {i < revealedCount && animateOnce && (
                  <g style={{ opacity: lineOpacity }}>
                    <circle cx={t.x} cy={t.y} r={0} fill="#ffffff" opacity={0.95}>
                      <animate attributeName="r" from="0" to="4" dur="0.16s" begin="0s" fill="freeze" />
                      <animate attributeName="opacity" from="0.95" to="0" dur="0.26s" begin="0.16s" fill="freeze" />
                    </circle>
                    <circle cx={t.x + 2} cy={t.y - 2} r="0.8" fill="#ffffff">
                      <animate attributeName="cx" from={t.x + 2} to={t.x + 8} dur="0.28s" begin="0.06s" fill="freeze" />
                      <animate attributeName="cy" from={t.y - 2} to={t.y - 6} dur="0.28s" begin="0.06s" fill="freeze" />
                      <animate attributeName="opacity" from="1" to="0" dur="0.28s" begin="0.06s" fill="freeze" />
                    </circle>
                    <circle cx={t.x - 1} cy={t.y + 1} r="0.8" fill="#ffffff">
                      <animate attributeName="cx" from={t.x - 1} to={t.x - 6} dur="0.28s" begin="0.06s" fill="freeze" />
                      <animate attributeName="cy" from={t.y + 1} to={t.y + 4} dur="0.28s" begin="0.06s" fill="freeze" />
                      <animate attributeName="opacity" from="1" to="0" dur="0.28s" begin="0.06s" fill="freeze" />
                    </circle>
                    <circle cx={t.x + 1} cy={t.y + 2} r="0.8" fill="#ffffff">
                      <animate attributeName="cx" from={t.x + 1} to={t.x + 5} dur="0.28s" begin="0.06s" fill="freeze" />
                      <animate attributeName="cy" from={t.y + 2} to={t.y + 6} dur="0.28s" begin="0.06s" fill="freeze" />
                      <animate attributeName="opacity" from="1" to="0" dur="0.28s" begin="0.06s" fill="freeze" />
                    </circle>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Logo mittig, sanft pulsierend */}
      {geoReady && (
        <div
          style={{
            position: "absolute",
            left: geo!.cx,
            top: geo!.cy,
            transform: "translate(-50%, -50%)",
            width: 120,
            height: 120,
            borderRadius: "50%",
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 18px 36px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.16)",
            animation: "primusPulse 4.8s ease-in-out infinite",
          }}
        >
          <Image src="/logo.png" alt="PRIMUS" width={120} height={120} style={{ objectFit: "cover", display: "block" }} priority />
        </div>
      )}

      {/* Begrüßung */}
      {geoReady && (
        <div
          style={{
            position: "absolute",
            left: geo!.cx,
            top: greetTop,
            transform: "translate(-50%, 0)",
            color: "#ffffff",
            textShadow: "0 3px 10px rgba(0,0,0,0.35)",
            fontWeight: 800,
            fontSize: "clamp(18px, 2.6vw, 28px)",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {displayName && displayName.trim().length > 0
            ? `${getGreetingByDaypart()}, ${displayName}!`
            : getGreetingByDaypart()}
        </div>
      )}

      {/* Buttons */}
      {geoReady &&
        buttons.map((b, i) => {
          const tgt = geo!.targets[i]; // durch geoReady garantiert vorhanden
          const isHoveredDim = hoverIdx !== null && hoverIdx !== i && selectedIdx === null;
          const opacity = selectedIdx === null ? (isHoveredDim ? 0.3 : 1) : (selectedIdx === i ? 1 : 0);
          const transform =
            selectedIdx === null
              ? "translate(-50%, -50%) scale(1)"
              : selectedIdx === i
              ? "translate(-50%, -50%) scale(1.02)"
              : "translate(-50%, -50%) scale(0.96)";

          return (
            <button
              key={b.key}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
              onClick={() => handleClick(i, b)}
              style={{
                position: "absolute",
                left: tgt.x,
                top: tgt.y,
                transform,
                padding: "12px 16px",
                border: "none",
                borderRadius: 14,
                background: b.color,
                color: "#fff",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                opacity,
                transition: "opacity 180ms ease, transform 100ms ease, filter 120ms ease",
                pointerEvents: selectedIdx !== null && selectedIdx !== i ? "none" : "auto",
                filter: hoverIdx === i && selectedIdx === null ? "brightness(1.08)" : "none",
              }}
              aria-label={b.label}
              title={b.label}
            >
              <span
                aria-hidden
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.18)",
                  flex: "0 0 28px",
                }}
              >
                {b.icon}
              </span>
              {b.label}
            </button>
          );
        })}

      {/* Debug-Overlay */}
      {debug && (
        <div
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 12,
            zIndex: 50,
            boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div><strong>Role:</strong> {role}</div>
          <div><strong>Buttons:</strong> {buttons.map(b => b.key).join(", ")}</div>
          <div><strong>geoReady:</strong> {geoReady ? "yes" : "no"}</div>
          <div><strong>targets:</strong> {geo ? geo.targets.length : 0}</div>
        </div>
      )}

      <style jsx global>{`
        @keyframes primusPulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.035); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </main>
  );
}
