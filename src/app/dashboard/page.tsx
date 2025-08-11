"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

type Btn = { id: string; label: string; href: string };

const BUTTONS: Btn[] = [
  { id: "dienst", label: "Dienst/Urlaub", href: "/dienstplan" },
  { id: "personal", label: "Personalabteilung", href: "/personal" },
  { id: "config", label: "Konfiguration", href: "/config" },
  { id: "archiv", label: "Archiv", href: "/archiv" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const btnRefs = useRef<Array<HTMLAnchorElement | null>>([]); // <-- angepasst

  // Auth-Check nur im Client; erst nach onAuthStateChanged entscheiden
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(auth as any)) {
      // Falls Firebase im Client noch nicht bereit ist: Seite anzeigen, aber nicht redirecten
      setInitializing(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUid(user.uid);
      }
      setInitializing(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      router.replace("/login");
    }
  };

  if (initializing) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <div>Lade Dashboard …</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Willkommen!</h1>

      <div className="grid grid-cols-2 gap-4">
        {BUTTONS.map((btn, i) => (
          <a
            key={btn.id}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            href={btn.href}
            className="px-4 py-3 rounded-xl border text-center"
          >
            {btn.label}
          </a>
        ))}
      </div>

      <button onClick={handleLogout} className="mt-8 px-4 py-2 rounded-xl border">
        Logout
      </button>

      <div className="text-xs text-neutral-500">UID: {uid ?? "—"}</div>
    </main>
  );
}
