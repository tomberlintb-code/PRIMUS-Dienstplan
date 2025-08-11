"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

type Btn = { id: string; label: string; href: string; color: string; icon: string };
const BUTTONS: Btn[] = [
  { id: "dienst",   label: "Dienstplan", href: "#", color: "#2563EB", icon: "📅" },
  { id: "urlaub",   label: "Urlaub",     href: "#", color: "#059669", icon: "🏖️" },
  { id: "personal", label: "Personal",   href: "#", color: "#7C3AED", icon: "👥" },
  { id: "archiv",   label: "Archiv",     href: "#", color: "#D97706", icon: "📦" },
  { id: "logout",   label: "Logout",     href: "#", color: "#DC2626", icon: "⏻" },
];

const POS = [
  { top: 14, left: 22 },
  { top: 22, left: 70 },
  { top: 68, left: 18 },
  { top: 76, left: 72 },
  { top: 42, left: 86 },
];

type P = { d: string };

export default function DashboardPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [paths, setPaths] = useState<P[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  // Bezierpfad (JETZT bis zum Button, keine Kürzung)
  const makePath = (ax: number, ay: number, bx: number, by: number): string => {
    const cx = (ax + bx) / 2;
    const cy = (ay + by) / 2 - 40;
    return `M ${ax} ${ay} Q ${cx} ${cy}, ${bx} ${by}`;
  };

  // Pfade aus realen DOM-Positionen berechnen
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

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut(auth);
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {/* rundes, langsamer pulsierendes Logo */}
      <motion.div
        ref={logoRef}
        style={styles.logoWrap}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      >
        <img src="/logo.png" alt="Logo" style={styles.logoImg} />
      </motion.div>

      {/* Buttons (Icon + Text) */}
      {BUTTONS.map((btn, i) => (
        <a
          key={btn.id}
          ref={(el) => { btnRefs.current[i] = el; }}
          href={btn.href}
          onClick={btn.id === "logout" ? handleLogout : undefined}
          style={{
            ...styles.btn,
            top: `${POS[i].top}%`,
            left: `${POS[i].left}%`,
            background: btn.color,
            opacity: hovered === null || hovered === btn.id ? 1 : 0.35,
            filter: hovered === null || hovered === btn.id ? "none" : "grayscale(60%)",
          }}
          onMouseEnter={() => setHovered(btn.id)}
          onMouseLeave={() => setHovered(null)}
        >
          <span style={styles.icon}>{btn.icon}</span>
          <span>{btn.label}</span>
        </a>
      ))}

      {/* Weiße Bezierkurven – nacheinander bis zum Button */}
      <svg style={styles.svg} width="100%" height="100%">
        {paths.map((p, i) => (
          <motion.path
            key={i}
            d={p.d}
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeOpacity={0.95}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: i * 0.35, ease: "easeOut" }}
          />
        ))}
      </svg>

      <style jsx>{`
        a { text-decoration: none; color: #fff; }
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
    background: "#0E3A8A",
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
    objectFit: "cover",
    borderRadius: "50%", // rund
    background: "#fff",
    boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
  },
  btn: {
    position: "absolute",
    zIndex: 4,
    padding: "12px 16px",
    borderRadius: 14,
    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
    transform: "translate(-50%, -50%)",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    userSelect: "none",
    cursor: "pointer",
  },
  icon: { fontSize: 18, lineHeight: 1 },
  svg: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    pointerEvents: "none",
  },
};
