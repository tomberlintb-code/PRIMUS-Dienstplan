// src/lib/useUserRole.ts
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";

export type Role = "admin" | "disp" | "personal";

type Result = {
  role: Role;
  canWrite: boolean;   // false für personal, true für disp/admin
  loading: boolean;
  user: User | null;
};

export function useUserRole(): Result {
  const [role, setRole] = useState<Role>("personal");
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUserState(u);
      if (!u) {
        setRole("personal");
        setLoading(false);
        return;
      }

      let r: Role | null = null;

      // 1) users/{uid}
      const uidRef = doc(db, "users", u.uid);
      const uidSnap = await getDoc(uidRef);
      if (uidSnap.exists()) {
        const val = ((uidSnap.data() as any).role || "").toString().toLowerCase();
        if (["admin", "disp", "personal"].includes(val)) r = val as Role;
      }

      // 2) Fallback per E-Mail (kein Auto-Anlegen)
      if (!r && u.email) {
        const q = query(collection(db, "users"), where("email", "==", u.email), limit(1));
        const qs = await getDocs(q);
        if (!qs.empty) {
          const val = ((qs.docs[0].data() as any).role || "").toString().toLowerCase();
          if (["admin", "disp", "personal"].includes(val)) r = val as Role;
        }
      }

      setRole(r ?? "personal");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { role, canWrite: role !== "personal", loading, user: userState };
}
