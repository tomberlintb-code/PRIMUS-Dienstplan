"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const btnRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Auth-Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-900 text-white text-lg">
        Dashboard wird geladen...
      </div>
    );
  }

  if (!user) {
    return null; // nicht eingeloggt → nichts anzeigen
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const buttons = [
    { id: "dienst", label: "Dienst/Urlaub", href: "#" },
    { id: "personal", label: "Personalabteilung", href: "#" },
    { id: "config", label: "Konfiguration", href: "#" },
    { id: "archiv", label: "Archiv", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-blue-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Willkommen, {user.email}</h1>
      <div className="grid grid-cols-2 gap-4">
        {buttons.map((btn, i) => (
          <a
            key={btn.id}
            ref={(el) => (btnRefs.current[i] = el)}
            href={btn.href}
            className="px-4 py-3 rounded-xl border text-center hover:bg-blue-700"
          >
            {btn.label}
          </a>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-500 px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
