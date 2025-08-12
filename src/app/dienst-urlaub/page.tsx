// src/app/dienst-urlaub/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useUserRole } from "../../lib/useUserRole";

type Entry = {
  id: string;
  date: string;          // YYYY-MM-DD
  employee: string;      // Name
  shift: "Früh" | "Spät" | "Nacht";
  notes?: string;
  createdAt?: any;
  createdBy?: string | null;
};

const SHIFTS: Array<Entry["shift"]> = ["Früh", "Spät", "Nacht"];

export default function DienstUrlaubPage() {
  const router = useRouter();
  const { user, role, canWrite, loading } = useUserRole();

  // Liste
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Formular
  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [employee, setEmployee] = useState<string>("");
  const [shift, setShift] = useState<Entry["shift"]>("Früh");
  const [notes, setNotes] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  // Auth-Redirect, wenn nicht eingeloggt
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Live-Liste aus /dienst
  useEffect(() => {
    const qy = query(collection(db, "dienst"), orderBy("date", "asc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: Entry[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            date: data.date || "",
            employee: data.employee || "",
            shift: (data.shift as Entry["shift"]) || "Früh",
            notes: data.notes || "",
            createdAt: data.createdAt,
            createdBy: data.createdBy || null,
          };
        });
        setEntries(list);
        setLoadingList(false);
      },
      (err) => {
        setMsg(`❌ Laden fehlgeschlagen: ${err.message || err}`);
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, []);

  // Formular befüllen zum Bearbeiten
  function startEdit(e: Entry) {
    setEditId(e.id);
    setDate(e.date);
    setEmployee(e.employee);
    setShift(e.shift);
    setNotes(e.notes || "");
    setMsg("");
  }

  // Formular leeren
  function resetForm() {
    setEditId(null);
    setDate("");
    setEmployee("");
    setShift("Früh");
    setNotes("");
  }

  // Anlegen / Speichern
  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setMsg("");

    if (!canWrite) {
      setMsg("ℹ️ Lesemodus: Dir fehlen Bearbeitungsrechte.");
      return;
    }
    if (!date || !employee) {
      setMsg("Bitte Datum und Name ausfüllen.");
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, "dienst", editId), {
          date,
          employee,
          shift,
          notes,
        });
        setMsg("✅ Eintrag aktualisiert.");
      } else {
        await addDoc(collection(db, "dienst"), {
          date,
          employee,
          shift,
          notes,
          createdAt: serverTimestamp(),
          createdBy: user?.uid || null,
        });
        setMsg("✅ Eintrag angelegt.");
      }
      resetForm();
    } catch (e: any) {
      setMsg(`❌ Schreibfehler: ${e?.code || e?.message || e}`);
    }
  }

  // Löschen
  async function handleDelete(id: string) {
    setMsg("");
    if (!canWrite) {
      setMsg("ℹ️ Lesemodus: Dir fehlen Bearbeitungsrechte.");
      return;
    }
    try {
      await deleteDoc(doc(db, "dienst", id));
      setMsg("🗑️ Eintrag gelöscht.");
      if (editId === id) resetForm();
    } catch (e: any) {
      setMsg(`❌ Löschfehler: ${e?.code || e?.message || e}`);
    }
  }

  const header = useMemo(
    () => (
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ color: "#0b1a2b", margin: 0 }}>Dienst & Urlaub</h1>
        <span style={{ color: "#64748b" }}>
          Rolle: <strong>{role}</strong> ·{" "}
          {canWrite ? "Bearbeiten erlaubt" : "Nur lesen"}
        </span>
      </div>
    ),
    [role, canWrite]
  );

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Lade…
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      {header}

      {/* Formular */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 16,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          padding: 16,
          display: "grid",
          gridTemplateColumns: "170px 1fr 170px 1fr auto",
          gap: 12,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#64748b" }}>
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={!canWrite}
            style={inputStyle(!canWrite)}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#64748b" }}>
            Mitarbeiter
          </label>
          <input
            type="text"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            disabled={!canWrite}
            placeholder="Vorname Nachname"
            style={inputStyle(!canWrite)}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#64748b" }}>
            Schicht
          </label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as any)}
            disabled={!canWrite}
            style={inputStyle(!canWrite)}
          >
            {SHIFTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#64748b" }}>
            Notiz
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canWrite}
            placeholder="optional"
            style={inputStyle(!canWrite)}
          />
        </div>

        <div style={{ display: "grid", alignItems: "end" }}>
          <button
            type="submit"
            disabled={!canWrite}
            style={{
              padding: "10px 14px",
              border: "none",
              borderRadius: 10,
              background: canWrite ? (editId ? "#0A7D4F" : "#0B5ED7") : "#93c5fd",
              color: "#fff",
              fontWeight: 700,
              cursor: canWrite ? "pointer" : "not-allowed",
              opacity: canWrite ? 1 : 0.8,
              whiteSpace: "nowrap",
            }}
            title={canWrite ? "" : "Nur Lesezugriff"}
          >
            {editId ? "Speichern" : "Anlegen"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                marginTop: 8,
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#fff",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      {/* Meldungen */}
      {msg && (
        <div
          style={{
            marginTop: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 12px",
            color: "#0f172a",
          }}
        >
          {msg}
        </div>
      )}

      {/* Liste */}
      <section
        style={{
          marginTop: 16,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#0f172a" }}>
              <th style={thTd}>Datum</th>
              <th style={thTd}>Mitarbeiter</th>
              <th style={thTd}>Schicht</th>
              <th style={thTd}>Notiz</th>
              <th style={{ ...thTd, width: 160, textAlign: "right" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr><td colSpan={5} style={{ ...thTd, textAlign: "center" }}>Lade…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} style={{ ...thTd, textAlign: "center" }}>Noch keine Einträge</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id}>
                  <td style={td}>{e.date}</td>
                  <td style={td}>{e.employee}</td>
                  <td style={td}>{e.shift}</td>
                  <td style={td}>{e.notes || "–"}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button
                      onClick={() => startEdit(e)}
                      disabled={!canWrite}
                      style={actionBtn(!canWrite)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={!canWrite}
                      style={{ ...actionBtn(!canWrite), marginLeft: 8, background: canWrite ? "#ef4444" : "#fecaca" }}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

/* --- Styles --- */
const thTd: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 14,
  color: "#111827",
};

function inputStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    background: disabled ? "#f1f5f9" : "#fff",
  };
}

function actionBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 10px",
    border: "none",
    borderRadius: 10,
    background: disabled ? "#93c5fd" : "#0B5ED7",
    color: "#fff",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.8 : 1,
  };
}
