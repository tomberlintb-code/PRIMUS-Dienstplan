// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0b3a92, #0a2f76)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
      }}
    >
      {/* Schriftzug mittig zwischen Oberkante und Login-Box */}
      <h1
        style={{
          fontSize: "2rem",
          color: "#fff",
          textAlign: "center",
          marginBottom: "40px",
          textShadow: "2px 2px 6px rgba(0,0,0,0.4)",
        }}
      >
        Einsatz- und Urlaubsplanung
      </h1>

      {/* Login-Box */}
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          width: "100%",
          maxWidth: "350px",
        }}
      >
        {/* Logo über dem Formular */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Image
            src="/logo.png"
            alt="PRIMUS"
            width={80}
            height={80}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "6px",
              border: "none",
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "6px",
              border: "none",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              background: "#0B5ED7",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Anmelden
          </button>
        </form>

        {error && (
          <p style={{ color: "#ffbaba", marginTop: "10px", textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
