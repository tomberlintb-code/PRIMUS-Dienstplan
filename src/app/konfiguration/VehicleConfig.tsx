"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import styles from "./Schichtarten.module.css";

interface Vehicle {
  id: string;
  name: string;
  kennzeichen: string;
}

export default function VehicleConfig() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [kennzeichen, setKennzeichen] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Daten laden
  useEffect(() => {
    const fetchVehicles = async () => {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      setVehicles(
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Vehicle, "id">),
        }))
      );
    };
    fetchVehicles();
  }, []);

  // Speichern (neu oder update)
  const handleSave = async () => {
    if (!name || !kennzeichen) return alert("Bitte alle Felder ausfüllen!");

    if (editId) {
      // Bearbeiten
      const ref = doc(db, "vehicles", editId);
      await updateDoc(ref, { name, kennzeichen });
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === editId ? { ...v, name, kennzeichen } : v
        )
      );
      setEditId(null);
    } else {
      // Neu hinzufügen
      const docRef = await addDoc(collection(db, "vehicles"), {
        name,
        kennzeichen,
      });
      setVehicles((prev) => [
        ...prev,
        { id: docRef.id, name, kennzeichen },
      ]);
    }

    setName("");
    setKennzeichen("");
  };

  // Bearbeiten starten
  const handleEdit = (vehicle: Vehicle) => {
    setName(vehicle.name);
    setKennzeichen(vehicle.kennzeichen);
    setEditId(vehicle.id);
  };

  // Löschen
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "vehicles", id));
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className={styles.windowWrapper}>
      <div className={styles.configWindow}>
        <h2>🚐 Fahrzeug-Konfiguration</h2>

        {/* Formular */}
        <div className={styles.formBox}>
          <input
            type="text"
            placeholder="Fahrzeugname"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Kennzeichen"
            value={kennzeichen}
            onChange={(e) => setKennzeichen(e.target.value)}
          />
          <button onClick={handleSave}>
            {editId ? "Änderungen speichern" : "Fahrzeug hinzufügen"}
          </button>
        </div>

        {/* Liste */}
        <ul className={styles.shiftList}>
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              🚑 <strong>{vehicle.name}</strong> ({vehicle.kennzeichen})
              <button
                onClick={() => handleEdit(vehicle)}
                style={{ marginLeft: "0.5rem" }}
              >
                Bearbeiten
              </button>
              <button
                onClick={() => handleDelete(vehicle.id)}
                style={{ marginLeft: "0.5rem", color: "red" }}
              >
                Löschen
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
