// src/app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

type Btn = {
  label: string;
  route?: string;
  onClick?: () => Promise<void> | void;
  color: string;
  icon: JSX.Element;
  angleDeg: number; // 0° = rechts, 90° = unten
};

type Geo = {
  cx: number;
  cy: number;
  targets: { x: number; y: number; len: number }[];
};

export default function DashboardPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [geo, setGeo] = useState<Geo | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [animateOnce, setAnimateOnce] = useState(false);

  const buttons: Btn[] = useMemo(
    () => [
      { label: "Dienst/Urlaub", route: "/dienst-urlaub", color: "#0B5ED7", icon: <span>📅</span>, angleDeg: -30 },
      { label: "Personalabteilung", route: "/personal", color: "#E10600", icon: <span>👥</span>, angleDeg: -100 },
      { label: "Konfiguration", route: "/konfiguration", color: "#0A7D4F", icon: <span>⚙️</span>, angleDeg: 20 },
      { label: "Archiv", route: "/archiv", color: "#F59E0B", icon: <span>📂</span>, angleDeg: 75 },
      { label: "Disposition", route: "/disposition", color: "#8B5CF6", icon: <span>🗂️</span>, angleDeg: 140 },
      {
        label: "Logout",
        color: "#111827",
        icon: <span>🚪</span>,
        angleDeg: -155,
        onClick: async () => {
          await signOut(auth);
          router.replace("/");
        },
      },
    ],
    [router]
  );

  // Nur beim ersten Laden der Seite animieren
  useEffect(() => {
    const shown = typeof window !== "undefined" && sessionStorage.getItem("brainstormShown") === "1";
    setAnimateOnce(!shown);
  }, []);

  // Geometrie berechnen (Logo Center, Buttons im Kreis)
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    const recompute = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.30;

      const targets = buttons.map((b) => {
        const rad = (b.angleDeg * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        const len = Math.hypot(x - cx, y - cy);
        return { x, y, len };
      });

      setGeo({ cx, cy, targets });
    };

    recompute();
    const onResize = () => recompute();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [buttons]);

  // Linien nacheinander sichtbar machen
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

  // Navigation
  function handleClick(b: Btn) {
    if (b.onClick) b.onClick();
    else if (b.route) router.push(b.route);
  }

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
      {/* SVG: Linien + sanfter Glow + Glitzer-Funken */}
      {geo && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <defs>
            {/* Weicher Glow um die weißen Linien */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {geo.targets.map((t, i) => {
            const dash = Math.max(t.len, 1);

            return (
              <g key={i}>
                {/* Hauptlinie */}
                <line
                  x1={geo.cx}
                  y1={geo.cy}
                  x2={t.x}
                  y2={t.y}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  style={{
                    strokeDasharray: dash,
                    strokeDashoffset: i < revealedCount ? 0 : dash,
                    transition: animateOnce ? "stroke-dashoffset 360ms ease-out" : "none",
                  }}
                />
                {/* Kleiner Glitzer-Funken am Button-Ende – dezent */}
                {i < revealedCount && animateOnce && (
                  <g>
                    {/* Kernblitz */}
                    <circle cx={t.x} cy={t.y} r={0} fill="#ffffff" opacity={0.95}>
                      <animate attributeName="r" from="0" to="4" dur="0.16s" begin="0s" fill="freeze" />
                      <animate attributeName="opacity" from="0.95" to="0" dur="0.26s" begin="0.16s" fill="freeze" />
                    </circle>
                    {/* 3 kleine Partikel, die kurz „aufspringen“ */}
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

      {/* Mittiges, rundes, sanft pulsierendes Logo */}
      {geo && (
        <div
          style={{
            position: "absolute",
            left: geo.cx,
            top: geo.cy,
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
          <Image
            src="/logo.png"
            alt="PRIMUS"
            width={120}
            height={120}
            style={{ objectFit: "cover", display: "block" }}
            priority
          />
        </div>
      )}

      {/* Buttons – farbig, kreisförmig verteilt */}
      {geo &&
        buttons.map((b, i) => (
          <button
            key={b.label}
            onClick={() => handleClick(b)}
            style={{
              position: "absolute",
              left: geo.targets[i].x,
              top: geo.targets[i].y,
              transform: "translate(-50%, -50%)",
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
              opacity: 1, // Buttons sind sofort sichtbar
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
        ))}

      {/* Puls-Animation fürs Logo */}
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
