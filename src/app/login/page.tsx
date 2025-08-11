"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true); // Warten bis Auth-Status sicher ist

  // Wenn schon eingeloggt, direkt aufs Dashboard – aber erst NACHDEM Firebase im Browser bereit ist
  useEffect(() => {
    // Falls im Serverkontext: nichts tun
    if (typeof window === "undefined") return;

    // auth ist im Serverkontext null (durch unseren Guard in firebase.ts)
    if (!(auth as any)) {
      setInitializing(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        router.replace("/dashboard");
      }
      setInitializing(false);
    });
    return () => unsub();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!(auth as any)) {
        setError("Clientinitialisierung läuft. Bitte kurz erneut versuchen.");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.code || "Anmeldung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  }

  if (initializing) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <div>Lade …</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6 shadow-sm bg-white/90">
        <h2 className="text-xl font-semibold text-center mb-4">Anmeldung</h2>
        <form onSubmit={onSubmit}>
          <input
            className="w-full mb-3 border rounded px-3 py-2"
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="w-full mb-3 border rounded px-3 py-2"
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            className="w-full border rounded px-4 py-2"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Prüfe …" : "Einloggen"}
          </button>
          {error && (
            <div className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
