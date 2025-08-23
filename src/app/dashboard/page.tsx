"use client";

import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [greeting, setGreeting] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 240;

  const allButtons = [
    { label: "Dienstplan", link: "/dienstplan", color: "#4CAF50", roles: ["user", "admin", "superadmin"] },
    { label: "Urlaub", link: "/urlaub", color: "#2196F3", roles: ["user", "admin", "superadmin"] },
    { label: "Disposition", link: "/disposition", color: "#d4a373", roles: ["admin", "superadmin"] },
    { label: "Personal", link: "/personal", color: "#ff9800", roles: ["admin", "superadmin"] },
    { label: "Konfiguration", link: "/konfiguration", color: "#9c27b0", roles: ["superadmin"] },
    { label: "Archiv", link: "/archiv", color: "#f44336", roles: ["admin", "superadmin"] },
    { label: "Logout", link: "logout", color: "#000000", roles: ["user", "admin", "superadmin"] }
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setGreeting("Guten Morgen");
    else if (hour < 18) setGreeting("Guten Tag");
    else setGreeting("Guten Abend");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data.name || "");
          setRole(data.role || "");
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleClick = (link: string) => {
    if (link === "logout") {
      signOut(auth).then(() => router.push("/"));
    } else {
      router.push(link);
    }
  };

  const visibleButtons = allButtons.filter(btn => btn.roles.includes(role));

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", height: "100vh", backgroundColor: "#093d9e" }}
    >
      <h2
        style={{
          position: "absolute",
          top: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: "2.5rem",
        }}
      >
        {greeting}, {userName}
      </h2>

      {/* Logo in der Mitte */}
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
          alt="PRIMUS"
          width={140}
          height={140}
          style={{
            borderRadius: "50%",
            animation: "pulse 2s infinite",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Buttons im Kreis */}
      {visibleButtons.map((btn, i) => {
        const angle = (i / visibleButtons.length) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return (
          <button
            key={i}
            onClick={() => handleClick(btn.link)}
            style={{
              position: "absolute",
              top: `calc(50% + ${y}px)`,
              left: `calc(50% + ${x}px)`,
              transform: "translate(-50%, -50%)",
              backgroundColor: btn.color,
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "15px 30px",
              minWidth: "110px",
              textAlign: "center",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "2px 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {btn.label}
          </button>
        );
      })}

      {/* Logo-Puls-Animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
