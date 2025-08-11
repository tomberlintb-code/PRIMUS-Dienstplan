// src/app/dashboard/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Btn = { id: string; label: string; href: string };
const BUTTONS: Btn[] = [
  { id: "dienst",   label: "Dienstplan", href: "#" },
  { id: "urlaub",   label: "Urlaub",     href: "#" },
  { id: "personal", label: "Personal",   href: "#" },
  { id: "archiv",   label: "Archiv",     href: "#" },
  { id: "logout",   label: "Logout",     href: "#" },
];

// feste „ungeordnete“ Grundpositionen in %
const POS = [
  { top: 14, left: 22 },
  { top: 22, left: 70 },
  { top: 68, left: 18 },
  { top: 76, left: 72 },
  { top: 42, left: 86 },
];

type P = { d: string };

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [paths, setPaths] = useState<P[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  // Bezier von A(logo) nach B(button) als Path "M ... Q ... , ..."
  const makePath = (ax: number, ay: number, bx: number, by: number): string => {
    const cx = (ax + bx) / 2;
    const cy = (ay + by) / 2 - 40; // Schwung nach oben
    return `M ${ax} ${ay} Q ${cx} ${cy}, ${bx} ${by}`;
  };

  // Nach Layout berechnen, wenn Größen feststehen
  const compute = () => {
    const cont = containerRef.current, logo = logoRef.current;
    if (!cont || !logo) return;

    const c = cont.getBoundingClientRect();
    const L = logo.getBoundingClientRect();
    const aX = L.left - c.left + L.width / 2;
    const aY = L.top  - c.top  + L.height / 2;

    const newPaths: P[] = [];
    btnRefs.current.forEach((el) => {
      if (!el) return;
      const b = el.getBoundingClientRect();
      const bX = b.left - c.left + b.width / 2;
      const bY = b.top  - c.top  + b.height / 2;
      newPaths.push({ d: makePath(aX, aY, bX, bY) });
    });
    setPaths(newPaths);
  };

  useEffect(() => {
    compute();
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", compute, { passive: true });
    window.addEventListener("scroll", compute, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
    };
  }, []);

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Pulsierendes Logo, exakt zentriert */}
      <motion.div
        ref={logoRef}
        style={styles.logoWrap}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <img src="/logo.png" alt="Logo" style={styles.logoImg} />
      </motion.div>

      {/* Buttons ungeordnet im Raum */}
      {BUTTONS.map((btn, i) => (
        <a
          key={btn.id}
          ref={(el) => { btnRefs.current[i] = el; }}
          href={btn.href}
          style={{
            ...styles.btn,
            top: `${POS[i].top}%`,
            left: `${POS[i].left}%`,
            opacity: hovered === null || hovered === btn.id ? 1 : 0.35,
            filter: hovered === null || hovered === btn.id ? "none" : "grayscale(70%)",
          }}
          onMouseEnter={() => setHovered(btn.id)}
          onMouseLeave={() => setHovered(null)}
        >
          {btn.label}
        </a>
      ))}

      {/* Weiße Bezierkurven – nacheinander zeichnen */}
      <svg style={styles.svg} width="100%" height="100%">
        {paths.map((p, i) => (
          <motion.path
            key={i}
            d={p.d}
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeOpacity={0.85}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: i * 0.35, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* Lokale Styles für Text/Links */}
      <style jsx>{`
        a { text-decoration: none; color: #0b1a3a; }
        a:hover { text-decoration: none; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100%",
    height: "100vh",
    background: "#0E3A8A", // sattes Blau
    overflow: "hidden",
  },
  logoWrap: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 3,
  },
  logoImg: {
    width: 140,
    height: 140,
    objectFit: "contain",
    filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
  },
  btn: {
    position: "absolute",
    zIndex: 4,
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
    transform: "translate(-50%, -50%)",
    fontWeight: 700,
    whiteSpace: "nowrap",
    userSelect: "none",
    cursor: "pointer",
  },
  svg: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    pointerEvents: "none",
  },
};
