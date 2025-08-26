"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ShiftType {
  id?: string;
  name: string;
  color: string;
  [key: string]: any; // 🔧 Fix: erlaubt beliebige Keys, damit updateDoc keine Typfehler wirft
}

export default function ShiftConfig() {
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [form, setForm] = useState<ShiftType>({ name: "", color: "" });
  const [editId, setEditId] = useState<string | null>(null);

  // Daten laden
  useEffect(() => {
    const loadShifts = async () => {
      const querySnapshot = await getDocs(collection(db, "shiftTypes"));
      const data: ShiftType[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as ShiftType);
      });
      setShifts(data);
    };
    loadShifts();
  }, []);

  // Formularänderung
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Speichern (Neu oder Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      const ref = doc(db, "shiftTypes", editId);
      await updateDoc(ref, {
        name: form.name,
        color: form.color,
      });
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editId ? { ...form, id: editId } : s
        )
      );
      setEditId(null);
    } else {
      const docRef = await addDoc(collection(db, "shiftTypes"), form);
      setShifts([...shifts, { ...form, id: docRef.id }]);
    }
    setForm({ name: "", color: "" });
  };

  // Bearbeiten
  const handleEdit = (shift: ShiftType) => {
    setForm({ name: shift.name, color: shift.color });
    setEditId(shift.id || null);
  };

  // Löschen
  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, "shiftTypes", id));
    setShifts(shifts.filter((s) => s.id !== id));
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Schichtarten konfigurieren</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 mr-2"
          required
        />
        <input
          type="color"
          name="color"
          value={form.color}
          onChange={handleChange}
          className="border p-2 mr-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editId ? "Aktualisieren" : "Hinzufügen"}
        </button>
      </form>

      <ul>
        {shifts.map((shift) => (
          <li
            key={shift.id}
            className="flex items-center justify-between mb-2 p-2 border rounded"
          >
            <span className="flex items-center">
              <span
                className="w-4 h-4 mr-2 rounded"
                style={{ backgroundColor: shift.color }}
              ></span>
              {shift.name}
            </span>
            <span>
              <button
                onClick={() => handleEdit(shift)}
                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
              >
                Bearbeiten
              </button>
              <button
                onClick={() => handleDelete(shift.id)}
                className="bg-red-600 text-white px-2 py-1 rounded"
              >
                Löschen
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
