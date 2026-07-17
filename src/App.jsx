import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
const AVATAR_KEY = "unexa_profile_avatar";
const COVER_KEY = "unexa_profile_cover";

export default function App() {
  const [selectedUni, setSelectedUni] = useState(null);
  const location = useLocation();

  const [savedUniversities, setSavedUniversities] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_UNIS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      return localStorage.getItem(AVATAR_KEY) || null;
    } catch {
      return null;
    }
  });

  const [coverUrl, setCoverUrl] = useState(() => {
    try {
      return localStorage.getItem(COVER_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_UNIS_KEY, JSON.stringify(savedUniversities));
    } catch {}
  }, [savedUniversities]);

  useEffect(() => {
    try {
      if (avatarUrl) localStorage.setItem(AVATAR_KEY, avatarUrl);
    } catch {}
  }, [avatarUrl]);

  useEffect(() => {
    try {
      if (coverUrl) localStorage.setItem(COVER_KEY, coverUrl);
    } catch {}
  }, [coverUrl]);

  // Selecting a university never changes the URL itself — only sidebar
  // navigation (NavLink) does. So any time the route changes, it means the
  // person navigated away via the sidebar, and the detail overlay should close.
  useEffect(() => {
    setSelectedUni(null);
  }, [location.pathname]);

  function toggleSaveUni(uni) {
    setSavedUniversities(prev =>
      prev.some(u => u.id === uni.id)
        ? prev.filter(u => u.id !== uni.id)
        : [...prev, uni]
    );
  }

  return (
    <div className="app">
      <Sidebar avatarUrl={avatarUrl} userInitials="KD" userName="Kateryna Dmyt..." />
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
                  avatarUrl={avatarUrl}
                  coverUrl={coverUrl}
                  onAvatarChange={setAvatarUrl}
                  onCoverChange={setCoverUrl}
                />
              }
            />
          </Routes>
        )}
      </main>
    </div>
  );
}