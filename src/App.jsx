import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CareerRoadmap from "./pages/CareerRoadmap";
import Community from "./pages/Community";
import UniversityDetail from "./pages/UniversityDetail";
import Profile from "./pages/Profile";
import "./styles/base.css";
import "./styles/community.css";
import "./styles/landing.css";
import "./styles/profile.css";

const SAVED_UNIS_KEY = "unexa_saved_universities";
const AVATAR_KEY = "unexa_profile_avatar";
const COVER_KEY = "unexa_profile_cover";
const AUTH_KEY = "unexa_auth_user";

export default function App() {
  const [selectedUni, setSelectedUni] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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
      if (avatarUrl) {
        localStorage.setItem(AVATAR_KEY, avatarUrl);
      } else {
        localStorage.removeItem(AVATAR_KEY);
      }
    } catch {}
  }, [avatarUrl]);

  useEffect(() => {
    try {
      if (coverUrl) {
        localStorage.setItem(COVER_KEY, coverUrl);
      } else {
        localStorage.removeItem(COVER_KEY);
      }
    } catch {}
  }, [coverUrl]);

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

  function handleLogin(user) {
    setAuthUser(user);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch {}
  }

  function handleLogout() {
    setAuthUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    navigate("/landing");
  }

  // ── Logged out: only Landing and Login are reachable ──
  if (!authUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // ── Logged in: full app ──
  const userInitials = authUser.name
    ? authUser.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="app">
      <Sidebar avatarUrl={avatarUrl} userInitials={userInitials} userName={authUser.name} />
      <main className="main">
        {selectedUni ? (
          <UniversityDetail
            uni={selectedUni}
            onBack={() => setSelectedUni(null)}
            savedUniversities={savedUniversities}
            onToggleSave={toggleSaveUni}
          />
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
                  userName={authUser.name}
                  onLogout={handleLogout}
                />
              }
            />
            <Route path="*" element={<Home onSelectUni={setSelectedUni} savedUniversities={savedUniversities} onToggleSave={toggleSaveUni} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}