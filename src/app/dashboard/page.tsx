"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔎 Dashboard mounted – waiting for auth...");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔥 Auth-Listener triggered. User:", user);

      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          console.log("📄 Firestore result:", docSnap.exists(), docSnap.data());

          if (docSnap.exists()) {
            setUserName(docSnap.data().name || "");
          } else {
            console.warn("⚠️ Kein Eintrag in 'users' für UID:", user.uid);
            setUserName("Unbekannt");
          }
        } catch (err) {
          console.error("❌ Fehler beim Laden von Firestore:", err);
        }
        setLoading(false);
      } else {
        console.warn("⚠️ Kein User eingeloggt, redirect auf /login");
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    console.log("👋 Logout gestartet");
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#093d9e",
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "1.5rem",
        }}
      >
        Lade Dashboard...
      </div>
    );
  }

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
        Willkommen, {userName || "Nutzer"}
      </div>

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
