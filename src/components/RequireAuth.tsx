"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("AUTH CHECK:", firebaseUser);
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#093d9e] text-white">
        <p>Lade Auth-Status...</p>
      </div>
    );
  }

  if (!user) {
    // ❌ kein sofortiges router.push mehr
    // 👉 stattdessen direkt die Login-Seite rendern
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#093d9e] text-white">
        <p>Bitte <a href="/login" className="underline">einloggen</a>!</p>
      </div>
    );
  }

  return <>{children}</>;
}
