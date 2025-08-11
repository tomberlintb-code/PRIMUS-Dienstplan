"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function Dashboard() {
  const [hovered, setHovered] = useState<number | null>(null);

  const buttons = [
    { id: 1, label: "Dienstplan", href: "#" },
    { id: 2, label: "Urlaub", href: "#" },
    { id: 3, label: "Personal", href: "#" },
    { id: 4, label: "Archiv", href: "#" },
    { id: 5, label: "Logout", href: "#" },
  ];

  // Positionen im "Brainstorming"-Stil (responsive in %)
  const positions = [
    { top: "10%", left: "60%" },
    { top: "20%", left: "20%" },
    { top: "70%", left: "15%" },
    { top: "75%", left: "70%" },
    { top: "40%", left: "85%" },
  ];

  // Funktion für Bezierpfade (vom Zentrum zur Button-Position)
  const getBezierPath = (targetLeft: string, targetTop: string) => {
    const centerX = 50; // %
    const centerY = 50; // %
    const targetX = parseFloat(targetLeft);
    const targetY = parseFloat(targetTop);

    // Kontrollpunkte für schöne Kurven
    const controlX = (centerX + targetX) / 2;
    const controlY = (centerY + targetY) / 2 - 15; // leicht nach oben versetzt

    return `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${targetX} ${targetY}`;
  };

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Logo mit Herzschlag */}
      <motion.div
        className="absolute z-20"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
        }}
      >
        <Image src="/logo.png" alt="Logo" width={150} height={150} />
      </motion.div>

      {/* Buttons */}
      {buttons.map((btn, i) => (
        <motion.a
          key={btn.id}
          href={btn.href}
          className={`absolute z-10 px-4 py-2 rounded-lg shadow-lg text-white text-lg font-semibold transition-all duration-300 ${
            hovered === null || hovered === btn.id
              ? "bg-blue-500"
              : "bg-gray-400 opacity-50"
          }`}
          style={positions[i]}
          onMouseEnter={() => setHovered(btn.id)}
          onMouseLeave={() => setHovered(null)}
          whileHover={{
            scale: 1.1,
            boxShadow: "0 0 20px rgba(0,0,255,0.6)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          {btn.label}
        </motion.a>
      ))}

      {/* Kurvige Linien-Animation */}
      <svg
        className="absolute top-0 left-0 w-full h-full z-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {positions.map((pos, i) => (
          <motion.path
            key={i}
            d={getBezierPath(pos.left, pos.top)}
            fill="transparent"
            stroke="blue"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1,
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
