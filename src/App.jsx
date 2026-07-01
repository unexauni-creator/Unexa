import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LanguageTests from "./pages/LanguageTests";
import Community from "./pages/Community";
import UniversityDetail from "./pages/UniversityDetail";
import "./styles/global.css";

export default function App() {
  const [selectedUni, setSelectedUni] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        {selectedUni ? (
          <div>
            <button
              onClick={() => setSelectedUni(null)}
              style={{ margin: "24px 32px 0", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "Nunito", fontSize: 16, color: "#634F44", fontWeight: 600 }}
            >
              ← Back
            </button>
            <UniversityDetail uni={selectedUni} />
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home onSelectUni={setSelectedUni} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/language-tests" element={<LanguageTests />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}