"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");

  // Auth-Check: bleib eingeloggt oder zurück auf Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User ist eingeloggt → Namen aus Firestore laden
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserName(docSnap.data().name || "");
        }
      } else {
        router.push("/login"); // nicht eingeloggt → zurück
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div
      style={{
        backgroundColor: "#093d9e",
        width: "100%",
        height: "100vh",
        position: "relative",
        color: "white",
      }}
    >
      {/* Begrüßung */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          width: "100%",
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        Willkommen, {userName || "Gast"}
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

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "red",
          color: "white",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

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
