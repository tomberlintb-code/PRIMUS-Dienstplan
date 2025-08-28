"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [positions, setPositions] = useState<{ top: number; left: number }[]>([]);
  const [geoReady, setGeoReady] = useState(false);

  const buttons = [
    { id: 1, label: "Dienst/Urlaub", link: "/dienstplan", color: "#2196F3" },
    { id: 2, label: "Personalabteilung", link: "/personal", color: "#4CAF50" },
    { id: 3, label: "Konfiguration", link: "/konfiguration", color: "#000000" },
    { id: 4, label: "Archiv", link: "/archiv", color: "#FF9800" },
    { id: 5, label: "Logout", link: "/logout", color: "#FF0000" },
  ];

  // Begrüßung aus Firebase holen
  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserName(docSnap.data().name || "");
        }
      }
    };
    fetchUserName();
  }, []);

  // Logout Funktion
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Button-Positionen im Kreis berechnen
  useEffect(() => {
    const computePositions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const radius = 240;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newPositions = buttons.map((_, i) => {
        const angle = (i / buttons.length) * 2 * Math.PI;
        return {
          top: centerY + radius * Math.sin(angle) - 25,
          left: centerX + radius * Math.cos(angle) - 50,
        };
      });
      setPositions(newPositions);
      setGeoReady(true);
    };

    computePositions();
    window.addEventListener("resize", computePositions);
    return () => window.removeEventListener("resize", computePositions);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: "#093d9e",
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Begrüßung */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          width: "100%",
          textAlign: "center",
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        Willkommen, {userName}
      </div>

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Image
          src="/logo.png"
          alt="PRIMUS Logo"
          width={200}
          height={200}
          style={{ borderRadius: "50%", animation: "pulse 3s infinite" }}
        />
      </div>

      {/* Buttons */}
      {geoReady &&
        buttons.map((btn, i) => {
          const faded = hovered === btn.id ? "opacity-100" : "opacity-80";
          return (
            <button
              key={btn.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }} // ✅ Fix hier
              className={`map-button ${faded}`}
              style={{
                position: "absolute",
                top: positions[i].top,
                left: positions[i].left,
                backgroundColor: btn.color,
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={() => setHovered(btn.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() =>
                btn.label === "Logout"
                  ? handleLogout()
                  : router.push(btn.link)
              }
            >
              {btn.label}
            </button>
          );
        })}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
