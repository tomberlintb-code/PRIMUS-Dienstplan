"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // 👈 optional: wenn angegeben, nur diese Rollen dürfen die Seite sehen
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AUTH CHECK:", firebaseUser);

      if (firebaseUser) {
        setUser(firebaseUser);

        // Rolle aus Firestore laden
        try {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            console.log("ROLE DATA:", data);
            setRole(data.role || null);
          } else {
            console.warn("Keine Rolle gefunden → User hat keinen Zugriff");
            setRole(null);
          }
        } catch (err) {
          console.error("Fehler beim Laden der Rolle:", err);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Solange Firebase noch prüft
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#093d9e] text-white">
        <p>Lade Auth-Status...</p>
      </div>
    );
  }

  // Kein User → Login
  if (!user) {
    router.push("/login");
    return null;
  }

  // Rolle prüfen (falls erlaubt)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-700 text-white">
        <p>Zugriff verweigert – Rolle „{role}“ nicht erlaubt.</p>
      </div>
    );
  }

  // Eingeloggt & Rolle passt
  return <>{children}</>;
}
