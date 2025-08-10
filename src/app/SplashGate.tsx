"use client";
import { useState, useEffect } from "react";

export default function SplashGate({ children }: { children: React.ReactNode }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 3000); // Start Fade-Out nach 3s
    const timer2 = setTimeout(() => setHidden(true), 4000);  // Verstecken nach Animation
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!hidden) {
    return (
      <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`}>
        <h1>PRIMUS Einsatzplanung</h1>
      </div>
    );
  }

  return <>{children}</>;
}
