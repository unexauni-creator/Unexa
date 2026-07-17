import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CareerRoadmap from "./pages/CareerRoadmap";
import Community from "./pages/Community";
import UniversityDetail from "./pages/UniversityDetail";
import Profile from "./pages/Profile";
import "./styles/base.css";
import "./styles/community.css";

const SAVED_UNIS_KEY = "unexa_saved_universities";

export default function App() {
  const [selectedUni, setSelectedUni] = useState(null);

  const [savedUniversities, setSavedUniversities] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_UNIS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_UNIS_KEY, JSON.stringify(savedUniversities));
    } catch {
      // localStorage unavailable (private mode, etc.) — fail silently
    }
  }, [savedUniversities]);

  function toggleSaveUni(uni) {
    setSavedUniversities(prev =>
      prev.some(u => u.id === uni.id)
        ? prev.filter(u => u.id !== uni.id)
        : [...prev, uni]
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        {selectedUni ? (
          <UniversityDetail uni={selectedUni} onBack={() => setSelectedUni(null)} />
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  onSelectUni={setSelectedUni}
                  savedUniversities={savedUniversities}
                  onToggleSave={toggleSaveUni}
                />
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/career-roadmap" element={<CareerRoadmap />} />
            <Route path="/community" element={<Community />} />
            <Route
              path="/profile"
              element={
                <Profile
                  savedUniversities={savedUniversities}
                  onToggleSave={toggleSaveUni}
                />
              }
            />
          </Routes>
        )}
      </main>
    </div>
  );
}