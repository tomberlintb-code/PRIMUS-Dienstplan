"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#093d9e] text-white flex-col">
        <p className="mb-4">⚠️ Du bist nicht eingeloggt.</p>
        <a
          href="/login"
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
        >
          Zum Login
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
