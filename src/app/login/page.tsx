"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Session im Browser speichern (nicht verlieren nach Redirect)
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard"); // nach Login weiter
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#093d9e",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "rgba(0,0,0,0.4)",
          padding: "2rem",
          borderRadius: "8px",
          width: "300px",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px", color: "black" }}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px", color: "black" }}
          required
        />
        {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}
        <button
          type="submit"
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "none",
            background: "#2196F3",
            color: "white",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
