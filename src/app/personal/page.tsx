"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserRole from "../../lib/useUserRole";

export default function PersonalPage() {
  const router = useRouter();
  const role = useUserRole();

  useEffect(() => {
    if (role !== "admin" && role !== "superadmin") {
      router.push("/dashboard");
    }
  }, [role, router]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Personalverwaltung</h1>
      <p>Hier kannst du Personal verwalten.</p>
    </div>
  );
}
