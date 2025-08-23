"use client";

import { useState } from "react";
import ShiftConfig from "./ShiftConfig";
import VehicleConfig from "./VehicleConfig";

export default function KonfigurationPage() {
  const [activeTab, setActiveTab] = useState("shift");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>⚙️ Konfiguration</h1>

      {/* Tabs */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("shift")}
          style={{
            marginRight: "1rem",
            background: activeTab === "shift" ? "#093d9e" : "#ccc",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          Schichtarten
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          style={{
            background: activeTab === "vehicle" ? "#093d9e" : "#ccc",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          Fahrzeuge
        </button>
      </div>

      {/* Inhalt je nach Tab */}
      {activeTab === "shift" && <ShiftConfig />}
      {activeTab === "vehicle" && <VehicleConfig />}
    </div>
  );
}
