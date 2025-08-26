"use client";

import RequireAuth from "@/components/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#093d9e] text-white">
        <h1 className="text-4xl font-bold mb-4">Willkommen im Dashboard 🚑</h1>
        <p className="text-lg">Du bist erfolgreich eingeloggt und siehst diese Seite nur, weil du authentifiziert bist.</p>
      </div>
    </RequireAuth>
  );
}
