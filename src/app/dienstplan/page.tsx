"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setUserName(snap.data().name || "");
          }
        } catch (err) {
          console.error("Fehler beim Laden des Namens:", err);
        }
      }
    };
    fetchUserName();
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Dienstplan</h1>
        {userName ? (
          <p className={styles.text}>Willkommen, {userName}!</p>
        ) : (
          <p className={styles.text}>Willkommen!</p>
        )}
      </div>
    </main>
  );
}
