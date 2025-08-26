"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Auth State beobachten
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log("AUTH STATE:", user); // 👈 Debug-Ausgabe
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("LOGIN ERROR:", err); // 👈 Debug-Ausgabe
      setError("Login fehlgeschlagen: " + err.message);
    }
  };

  // Optional: QueryParam (z. B. ?error=xyz)
  const queryError = searchParams?.get("error");

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#093d9e]">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {queryError && <p className="text-red-600 mb-4">{queryError}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Einloggen
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Lade Login…</div>}>
      <LoginForm />
    </Suspense>
  );
}
