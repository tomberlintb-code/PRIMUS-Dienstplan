"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import useUserRole from "../../../../lib/useUserRole";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import styles from "./planung.module.css";

export default function PlanungPage() {
  const router = useRouter();
  const { role } = useUserRole();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "shifts"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setShifts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const exportToPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dienstplan.pdf");
  };

  if (loading) {
    return <p>Lade Dienstplan...</p>;
  }

  return (
    <div className={styles.container}>
      <h1>Dienstplan</h1>
      <div ref={pdfRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Schicht</th>
              <th>Mitarbeiter</th>
              {role === "admin" && <th>Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.date}</td>
                <td>{shift.type}</td>
                <td>{shift.employee}</td>
                {role === "admin" && (
                  <td>
                    <button
                      onClick={async () =>
                        await deleteDoc(doc(db, "shifts", shift.id))
                      }
                    >
                      Löschen
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={exportToPDF}>Als PDF exportieren</button>
    </div>
  );
}
