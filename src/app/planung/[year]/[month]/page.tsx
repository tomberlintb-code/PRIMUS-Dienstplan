"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import useUserRole from "@/lib/useUserRole";
import { collection, getDocs } from "firebase/firestore";
import styles from "./planung.module.css";
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase"
import useUserRole from "@/lib/useUserRole"
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ---- Types ----
type Role = "admin" | "disp" | "personal";
type ShiftType = { id: string; code: string; name: string; color: string };
type Assignment = {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  shiftTypeId: string | null;
  vehicleId?: string | null;
  source?: "auto" | "manual";
  createdAt?: Timestamp;
};
type UserRow = { uid: string; displayName: string; isActive: boolean };

// ---- Utils ----
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function daysInMonth(year: number, month1to12: number) {
  const days: { date: Date; ymd: string; dow: number }[] = [];
  const m0 = month1to12 - 1;
  const d0 = new Date(Date.UTC(year, m0, 1));
  while (d0.getUTCMonth() === m0) {
    const y = d0.getUTCFullYear();
    const m = d0.getUTCMonth() + 1;
    const d = d0.getUTCDate();
    days.push({ date: new Date(d0), ymd: `${y}-${pad(m)}-${pad(d)}`, dow: d0.getUTCDay() }); // 0=So
    d0.setUTCDate(d0.getUTCDate() + 1);
  }
  return days;
}
// ISO Kalenderwoche
function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((+date - +firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return week;
}

function useMonthData(year: number, month: number) {
  const range = useMemo(() => {
    const arr = daysInMonth(year, month);
    const start = arr[0]?.ymd ?? `${year}-${pad(month)}-01`;
    const end = arr[arr.length - 1]?.ymd ?? `${year}-${pad(month)}-28`;
    return { arr, start, end };
  }, [year, month]);
  return range;
}

// ---- Seite ----
export default function Planungsseite({ params }: { params: { year: string; month: string } }) {
  const router = useRouter();
  const y = parseInt(params.year, 10);
  const m = parseInt(params.month, 10);
  const { arr: days, start, end } = useMonthData(y, m);

  const { user, role, loading } = useUserRole();
  const canWrite = role === "admin" || role === "disp";

  // Benutzer laden (aktive Mitarbeiter)
  const [rows, setRows] = useState<UserRow[]>([]);
  useEffect(() => {
    const q = query(collection(db, "users"), where("isActive", "==", true), orderBy("displayName", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: UserRow[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({ uid: d.id, displayName: data.displayName || data.name || data.email || d.id, isActive: !!data.isActive });
      });
      setRows(list);
    });
    return () => unsub();
  }, []);

  // ShiftTypes laden (fallback anlegen, falls leer)
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "shiftTypes"), limit(10)));
      if (snap.empty) {
        // Minimal-Defaults wie im Screenshot
        const defaults: ShiftType[] = [
          { id: "early", code: "5/14", name: "Frühdienst", color: "#16a34a" },
          { id: "mid", code: "6/15", name: "Mitteldienst", color: "#2563eb" },
          { id: "late", code: "11/19", name: "Spätdienst", color: "#ea580c" },
          { id: "WF", code: "WF", name: "Wunschfrei", color: "#dc2626" },
          { id: "U", code: "U", name: "Urlaub", color: "#f59e0b" },
          { id: "—", code: "·", name: "Leer", color: "#e5e7eb" },
        ];
        await Promise.all(defaults.map((st) => setDoc(doc(db, "shiftTypes", st.id), st)));
        setShiftTypes(defaults);
      } else {
        const arr: ShiftType[] = [];
        snap.forEach((d) => arr.push(d.data() as ShiftType));
        // Sortierung ähnlich wie im Plan
        arr.sort((a, b) => ["early", "mid", "late", "WF", "U", "—"].indexOf(a.id) - ["early", "mid", "late", "WF", "U", "—"].indexOf(b.id));
        setShiftTypes(arr);
      }
    })();
  }, []);

  // Belegungen des Monats (assignments)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  useEffect(() => {
    const qA = query(
      collection(db, "assignments"),
      where("date", ">=", start),
      where("date", "<=", end)
    );
    const unsub = onSnapshot(qA, (snap) => {
      const list: Assignment[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setAssignments(list);
    });
    return () => unsub();
  }, [start, end]);

  // Map (uid, ymd) -> Assignment
  const aIndex = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) map.set(`${a.uid}|${a.date}`, a);
    return map;
  }, [assignments]);

  // Handler
  async function setCell(uid: string, ymd: string, shiftTypeId: string | null) {
    if (!canWrite) return;
    const key = `${uid}|${ymd}`;
    const ex = aIndex.get(key);
    try {
      if (ex) {
        await updateDoc(doc(db, "assignments", ex.id), {
          shiftTypeId,
          source: "manual",
        });
      } else {
        await addDoc(collection(db, "assignments"), {
          uid,
          date: ymd,
          shiftTypeId,
          source: "manual",
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(e);
      alert("Speichern fehlgeschlagen.");
    }
  }
  async function clearCell(uid: string, ymd: string) {
    if (!canWrite) return;
    const key = `${uid}|${ymd}`;
    const ex = aIndex.get(key);
    if (ex) await deleteDoc(doc(db, "assignments", ex.id));
  }

  // PDF Export
  const pdfRef = useRef<HTMLDivElement | null>(null);
  async function exportPDF() {
    const el = pdfRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    // Inhalt proportional einpassen
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(pageW / imgW, pageH / imgH);
    const w = imgW * ratio;
    const h = imgH * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    pdf.addImage(img, "PNG", x, y, w, h);
    pdf.save(`Dienstplan_${y}_${pad(m)}.pdf`);
  }

  // Dropdown für Schichtwahl
  const [picker, setPicker] = useState<{ uid: string; ymd: string; x: number; y: number } | null>(null);

  // Schutz: redirect wenn nicht eingeloggt
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Anzeige
  const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });

  if (!user) return <main style={center}>Lade…</main>;

  return (
    <main style={{ padding: 16 }}>
      <div style={toolbar}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0b1a2b" }}>
          Entwurf {monthLabel}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/dashboard")} style={btnGhost}>Zurück</button>
          <button onClick={exportPDF} style={btnPrimary(true)}>Als PDF exportieren</button>
        </div>
      </div>

      <div ref={pdfRef} style={sheet}>
        {/* Kopfzeile wie im Screenshot: Monat + Legende */}
        <div style={legendRow}>
          {shiftTypes.map((st) => (
            <div key={st.id} style={legendItem}>
              <span style={{ ...chip, background: st.color }} />
              <span style={{ fontWeight: 700 }}>{st.code}</span>&nbsp;{st.name}
            </div>
          ))}
        </div>

        {/* Tabelle */}
        <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={thName}>Mitarbeiter</th>
                {days.map((d, idx) => {
                  const dow = "SoMoDiMiDoFrSa"[(d.dow % 7)];
                  const isWE = d.dow === 0 || d.dow === 6;
                  const kw = (idx === 0 || d.date.getUTCDay() === 1) ? isoWeek(d.date) : undefined;
                  return (
                    <th key={d.ymd} style={{ ...thDay, background: isWE ? "#eef2ff" : "#f8fafc" }}>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{kw ? `KW ${kw}` : " "}</div>
                      <div style={{ fontWeight: 800 }}>{new Date(d.ymd).getUTCDate()}</div>
                      <div style={{ fontSize: 11, color: "#334155" }}>
                        {["So","Mo","Di","Mi","Do","Fr","Sa"][d.dow]}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uid}>
                  <th style={tdName}>{r.displayName}</th>
                  {days.map((d) => {
                    const a = aIndex.get(`${r.uid}|${d.ymd}`);
                    const st = a ? shiftTypes.find(x => x.id === a.shiftTypeId) : undefined;
                    const bg = st ? st.color : "#f1f5f9";
                    const label = st ? st.code : "·";
                    const isWE = d.dow === 0 || d.dow === 6;
                    return (
                      <td
                        key={d.ymd}
                        onClick={(ev) => {
                          if (!canWrite) return;
                          const rect = (ev.target as HTMLElement).getBoundingClientRect();
                          setPicker({ uid: r.uid, ymd: d.ymd, x: rect.left + rect.width / 2, y: rect.top + window.scrollY + rect.height });
                        }}
                        onContextMenu={(ev) => {
                          ev.preventDefault();
                          if (canWrite) clearCell(r.uid, d.ymd);
                        }}
                        style={{
                          ...tdCell,
                          background: st ? bg : (isWE ? "#f8fafc" : "#ffffff"),
                          color: st ? "#fff" : "#94a3b8",
                          borderLeft: isWE ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                          borderTop: "1px solid #e2e8f0",
                          fontWeight: st ? 800 : 700,
                          textShadow: st ? "0 1px 0 rgba(0,0,0,0.25)" : "none",
                        }}
                        title={st ? st.name : "Leer"}
                      >
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {/* Fußzeile: einfache Zählung pro Tag */}
            <tfoot>
              <tr>
                <th style={{ ...tdName, background: "#f8fafc" }}>Besetzung</th>
                {days.map((d) => {
                  const count = assignments.filter(a => a.date === d.ymd && a.shiftTypeId && !["WF","U","—"].includes(String(a.shiftTypeId))).length;
                  return (
                    <td key={d.ymd} style={{ ...tdCell, background: "#f8fafc", fontWeight: 800, color: "#0f172a" }}>
                      {count}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Picker */}
      {picker && canWrite && (
        <div
          style={{
            position: "absolute",
            left: picker.x,
            top: picker.y + 6,
            transform: "translateX(-50%)",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            padding: 8,
            zIndex: 50,
          }}
          onMouseLeave={() => setPicker(null)}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {shiftTypes.map((st) => (
              <button
                key={st.id}
                onClick={() => { setCell(picker.uid, picker.ymd, st.id); setPicker(null); }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 800,
                }}
                title={st.name}
              >
                <span style={{ ...chip, background: st.color }} />
                {st.code}
              </button>
            ))}
            <button
              onClick={() => { setCell(picker.uid, picker.ymd, null); setPicker(null); }}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer" }}
              title="Leer"
            >
              Leer
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Rechtsklick: Zelle leeren</div>
        </div>
      )}
    </main>
  );
}

// ---- Styles ----
const sheet: React.CSSProperties = { background: "#ffffff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" };
const toolbar: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const legendRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 };
const legendItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0f172a" };
const chip: React.CSSProperties = { width: 16, height: 16, borderRadius: 4, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" };
const thName: React.CSSProperties = { position: "sticky" as any, left: 0, zIndex: 2, background: "#ffffff", borderBottom: "2px solid #e2e8f0", padding: "10px 12px", textAlign: "left" as any, minWidth: 190 };
const thDay: React.CSSProperties = { padding: 6, borderBottom: "2px solid #e2e8f0", textAlign: "center" as any, minWidth: 48 };
const tdName: React.CSSProperties = { position: "sticky" as any, left: 0, zIndex: 1, background: "#ffffff", borderRight: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0", padding: "8px 12px", fontWeight: 700, color: "#0f172a" };
const tdCell: React.CSSProperties = { textAlign: "center", padding: "8px 6px", cursor: "pointer", userSelect: "none" };
const center: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center" };
const btnPrimary = (enabled: boolean): React.CSSProperties => ({
  padding: "10px 14px", border: "none", borderRadius: 10, background: enabled ? "#0B5ED7" : "#94a3b8", color: "#fff", fontWeight: 800, cursor: enabled ? "pointer" : "not-allowed"
});
const btnGhost: React.CSSProperties = { padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 800, cursor: "pointer" };
