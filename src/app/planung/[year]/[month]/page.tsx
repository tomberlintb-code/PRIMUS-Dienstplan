"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import useUserRole from "../../lib/useUserRole";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import styles from "./planung.module.css";

export default function MonatsPlanungPage() {
  const [schichten, setSchichten] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userRole = useUserRole();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "dienstplan"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchichten(data);
      } catch (error) {
        console.error("Fehler beim Laden der Schichten:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const exportPDF = async () => {
    const input = document.getElementById("planung-container");
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = (pdf as any).getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dienstplan.pdf");
  };

  if (loading) {
    return <p>Lade Schichten...</p>;
  }

  return (
    <div className={styles.container}>
      <h1>Dienstplan Monatsansicht</h1>

      <div id="planung-container" className={styles.planung}>
        {schichten.length === 0 ? (
          <p>Keine Schichten gefunden.</p>
        ) : (
          <ul>
            {schichten.map((schicht) => (
              <li key={schicht.id}>
                {schicht.datum} – {schicht.typ} – {schicht.mitarbeiter}
              </li>
            ))}
          </ul>
        )}
      </div>

      {userRole === "admin" && (
        <button onClick={exportPDF} className={styles.exportButton}>
          PDF Exportieren
        </button>
      )}
    </div>
  );
}
