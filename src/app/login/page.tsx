// src/app/login/page.tsx
"use client";

export default function LoginPage() {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Login button clicked!");
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
        <h2 style={{ textAlign: "center" }}>Login Debug</h2>
        <input
          type="email"
          placeholder="Email"
          style={{ padding: "0.5rem", borderRadius: "4px", color: "black" }}
        />
        <input
          type="password"
          placeholder="Passwort"
          style={{ padding: "0.5rem", borderRadius: "4px", color: "black" }}
        />
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

/*
-------------------------------------------------------
Jetzt im Terminal (einmal alles kopieren & ausführen):
-------------------------------------------------------

git add src/app/login/page.tsx && \
git commit -m "test: minimal login page with console.log" && \
git push origin main
*/
