"use client";

export default function LoginPage() {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Login button clicked!");
  };

  return (
    <form
      onSubmit={handleLogin}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
        margin: "100px auto",
      }}
    >
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Passwort" />
      <button type="submit">Login</button>
    </form>
  );
}
