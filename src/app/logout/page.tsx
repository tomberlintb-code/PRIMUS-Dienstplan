"use client";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/session", { method: "DELETE" });
        await signOut(auth);
      } catch (e) {
        console.error("❌ Logout-Fehler:", e);
      } finally {
        router.replace("/login");
      }
    })();
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#093d9e",
      color: "white"
    }}>
      <p>Abmelden…</p>
    </main>
  );
}
