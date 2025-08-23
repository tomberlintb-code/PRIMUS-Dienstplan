"use client";

import { useEffect, useState } from "react";
import styles from "./Schichtarten.module.css";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface ShiftType {
  id?: string;
  name: string;
  kuerzel: string;
  stundenwert: number;
  von: string;
  bis: string;
  wochentage: string[];
  farbe: string;
}

export default function ShiftConfig() {
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [form, setForm] = useState<ShiftType>({
    name: "",
    kuerzel: "",
    stundenwert: 0,
    von: "",
    bis: "",
    wochentage: [],
    farbe: "#2196f3",
  });
  const [editId, setEditId] = useState<string | null>(null);

  // Firestore laden
  useEffect(() => {
    const load = async () => {
      const snapshot = await getDocs(collection(db, "shiftTypes"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ShiftType) }));
      setShifts(data);
    };
    load();
  }, []);

  // Input-Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "wochentage") {
      setForm((prev) => ({
        ...prev,
        wochentage: checked
          ? [...prev.wochentage, value]
          : prev.wochentage.filter((d) => d !== value),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  // Speichern / Bearbeiten
  const handleSave = async () => {
    if (editId) {
      const ref = doc(db, "shiftTypes", editId);
      await updateDoc(ref, form);
      setShifts((prev) =>
        prev.map((s) => (s.id === editId ? { ...form, id: editId } : s))
      );
      setEditId(null);
    } else {
      const docRef = await addDoc(collection(db, "shiftTypes"), form);
      setShifts((prev) => [...prev, { ...form, id: docRef.id }]);
    }

    setForm({
      name: "",
      kuerzel: "",
      stundenwert: 0,
      von: "",
      bis: "",
      wochentage: [],
      farbe: "#2196f3",
    });
  };

  // Bearbeiten
  const handleEdit = (shift: ShiftType) => {
    setForm(shift);
    setEditId(shift.id!);
  };

  // Löschen
  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, "shiftTypes", id));
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className={styles.container}>
      {/* Linkes Fenster: Formular */}
      <div className={styles.formBox}>
        <h2>⚙️ Schichtarten-Konfiguration</h2>
        <label>
          Name:
          <input type="text" name="name" value={form.name} onChange={handleChange} />
        </label>

        <label>
          Kürzel:
          <input type="text" name="kuerzel" value={form.kuerzel} onChange={handleChange} />
        </label>

        <label>
          Stundenwert:
          <input
            type="number"
            name="stundenwert"
            value={form.stundenwert}
            onChange={handleChange}
          />
        </label>

        <label>
          Von:
          <input type="time" name="von" value={form.von} onChange={handleChange} />
        </label>

        <label>
          Bis:
          <input type="time" name="bis" value={form.bis} onChange={handleChange} />
        </label>

        <fieldset>
          <legend>Aktive Wochentage:</legend>
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((tag) => (
            <label key={tag} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="wochentage"
                value={tag}
                checked={form.wochentage.includes(tag)}
                onChange={handleChange}
              />
              {tag}
            </label>
          ))}
        </fieldset>

        <label>
          Farbe:
          <input type="color" name="farbe" value={form.farbe} onChange={handleChange} />
        </label>

        <button onClick={handleSave}>{editId ? "Aktualisieren" : "Speichern"}</button>
      </div>

      {/* Rechtes Fenster: Übersicht */}
      <div className={styles.listBox}>
        <h3>📋 Angelegte Schichten</h3>
        <ul>
          {shifts.map((shift) => (
            <li key={shift.id} style={{ borderLeft: `6px solid ${shift.farbe}` }}>
              <div>
                <strong>{shift.name}</strong> ({shift.kuerzel}) – {shift.stundenwert} Std.
              </div>
              <div>
                ⏰ {shift.von} - {shift.bis}
              </div>
              <div>
                📅 {shift.wochentage && shift.wochentage.length > 0 ? shift.wochentage.join(", ") : "–"}
              </div>
              <div className={styles.actions}>
                <button onClick={() => handleEdit(shift)}>✏️</button>
                <button onClick={() => handleDelete(shift.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
