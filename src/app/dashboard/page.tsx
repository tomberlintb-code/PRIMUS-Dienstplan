"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Image from "next/image";

type Btn = { id: number; label: string; icon: string; path?: string };
type Line = { x1: number; y1: number; x2: number; y2: number; id: number };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [animTick, setAnimTick] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [svgSize, setSvgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [lines, setLines] = useState<Line[]>([]);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  // Breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const buttons: Btn[] = useMemo(
    () => [
      { id: 1, label: "Dienstplan",    icon: "📅", path: "/dienstplan" },
      { id: 2, label: "Urlaub",        icon: "🏖️", path: "/urlaub" },
      { id: 3, label: "Konfiguration", icon: "⚙️", path: "/konfiguration" },
      { id: 4, label: "Archiv",        icon: "📂", path: "/archiv" },
      { id: 5, label: "Logout",        icon: "🚪" }, // Logout via handleClick
    ],
    []
  );

  const positions = useMemo(() => {
    if (!isMobile) {
      return [
        { top: "18%", left: "50%" }, // Dienstplan
        { top: "40%", left: "82%" }, // Urlaub
        { top: "75%", left: "70%" }, // Konfiguration
        { top: "75%", left: "30%" }, // Archiv
        { top: "40%", left: "18%" }, // Logout
      ];
    }
    return [
      { top: "20%", left: "50%" },
      { top: "45%", left: "80%" },
      { top: "75%", left: "65%" },
      { top: "75%", left: "35%" },
      { top: "45%", left: "20%" },
    ];
  }, [isMobile]);

  const handleClick = async (btn: Btn) => {
    if (btn.label === "Logout") {
      await signOut(auth);
      router.push("/");
      return;
    }
    if (btn.path) router.push(btn.path);
  };

  const handleLogoEnter = () => setAnimTick((t) => t + 1);

  const recomputeLines = () => {
    const cont = containerRef.current;
    const logo = logoRef.current;
    if (!cont || !logo) return;

    const contRect = cont.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();

    const logoCx = logoRect.left - contRect.left + logoRect.width / 2;
    const logoCy = logoRect.top - contRect.top + logoRect.height / 2;
    const logoR = Math.min(logoRect.width, logoRect.height) / 2;

    setSvgSize({ w: contRect.width, h: contRect.height });

    const newLines: Line[] = [];

    btnRefs.current.forEach((btnEl, i) => {
      if (!btnEl) return;
      const br = btnEl.getBoundingClientRect();
      const btnCx = br.left - contRect.left + br.width / 2;
      const btnCy = br.top - contRect.top + br.height / 2;
      const btnR = Math.min(br.width, br.height) / 2;

      const dx = btnCx - logoCx;
      const dy = btnCy - logoCy;
      const dist = Math.hypot(dx, dy) || 1;

      const x1 = logoCx + (dx / dist) * (logoR + 2);
      const y1 = logoCy + (dy / dist) * (logoR + 2);
      const x2 = btnCx - (dx / dist) * (btnR + 2);
      const y2 = btnCy - (dy / dist) * (btnR + 2);

      newLines.push({ x1, y1, x2, y2, id: i });
    });

    setLines(newLines);
  };

  useLayoutEffect(() => {
    recomputeLines();

    const onResize = () => recomputeLines();
    window.addEventListener("resize", onResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => recomputeLines());
      if (containerRef.current) ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, animTick, positions]);

  useEffect(() => {
    const t = setTimeout(recomputeLines, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const t = setTimeout(() => setAnimTick((t) => t + 1), 60);
      return () => clearTimeout(t);
    }
  }, [isMobile]);

  return (
    <div ref={containerRef} className="dashboard-container">
      {/* Linien (SVG) */}
      <svg
        className="lines-svg"
        key={animTick}
        width={svgSize.w}
        height={svgSize.h}
        viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
      >
        {lines.map((ln) => {
          const faded =
            hovered !== null && hovered !== buttons[ln.id].id ? "faded" : "";
          return (
            <line
              key={ln.id}
              x1={ln.x1}
              y1={ln.y1}
              x2={ln.x2}
              y2={ln.y2}
              className={`map-line animate ${faded}`}
            />
          );
        })}
      </svg>

      {/* Logo */}
      <div
        ref={logoRef}
        className="center-logo"
        onMouseEnter={handleLogoEnter}
        onTouchStart={() => setAnimTick((t) => t + 1)}
      >
        <Image
          src="/logo.png"
          alt="PRIMUS Logo"
          width={isMobile ? 96 : 140}
          height={isMobile ? 96 : 140}
          className="logo-image"
          priority
        />
      </div>

      {/* Buttons */}
      <div className="buttons-layer">
        {buttons.map((btn, i) => {
          const faded =
            hovered !== null && hovered !== btn.id ? "faded" : "";
          return (
            <button
              key={btn.id}
              ref={(el) => { btnRefs.current[i] = el; }}
              className={`map-button ${faded}`}
              style={{ top: positions[i].top, left: positions[i].left }}
              onMouseEnter={() => setHovered(btn.id)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(btn.id)}
              onTouchEnd={() => setHovered(null)}
              onClick={() => handleClick(btn)}
              aria-label={btn.label}
              title={btn.label}
            >
              <span className="icon">{btn.icon}</span>
              <span className="label">{btn.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
