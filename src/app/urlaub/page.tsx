"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "../dashboard/dashboard.module.css"

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Buttons – Disposition neu eingefügt
  const buttons = [
    { id: 1, label: "Dienstplan", link: "/dienstplan", color: "#42a5f5" },
    { id: 2, label: "Disposition", link: "/dispo", color: "#26a69a" },
    { id: 3, label: "Personalabteilung", link: "/personal", color: "#ffa726" },
    { id: 4, label: "Konfiguration", link: "/konfiguration", color: "#ab47bc" },
    { id: 5, label: "Archiv", link: "/archiv", color: "#78909c" },
    { id: 6, label: "Urlaub", link: "/urlaub", color: "#4caf50" },
    { id: 7, label: "Logout", link: "/logout", color: "#ef5350" },
  ];

  // Begrüßung nach Tageszeit
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting("Guten Morgen");
    else if (hour < 18) setGreeting("Guten Tag");
    else setGreeting("Guten Abend");
  }, []);

  // Usernamen aus Firestore laden
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUserName(snap.data().name || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Positionierung der Buttons im Kreis
  const radius = 400; // Abstand vom Logo
  const angleStep = (2 * Math.PI) / buttons.length;

  return (
    <div className={styles.dashboard} ref={containerRef}>
      {/* Begrüßung */}
      <div className={styles.greeting}>
        {greeting} {userName}
      </div>

      {/* Logo in der Mitte */}
      <div className={styles.logoCenter}>
        <div className={styles.logoPulse}>
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className={styles.logoImg}
          />
        </div>
      </div>

      {/* Buttons im Kreis */}
      {buttons.map((btn, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return (
          <button
            key={btn.id}
            className={styles.circleButton}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              backgroundColor: btn.color,
            }}
            onClick={() => router.push(btn.link)}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}
