import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CareerRoadmap from "./pages/CareerRoadmap";
import Community from "./pages/Community";
import UniversityDetail from "./pages/UniversityDetail";
import Profile from "./pages/Profile";
import { supabase } from "./lib/supabaseClient";
import "./styles/base.css";
import "./styles/community.css";
import "./styles/landing.css";
import "./styles/profile.css";
import "./styles/university-detail.css";
import "./styles/teachers-section.css";
import Onboarding from "./pages/Onboarding";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const SAVED_UNIS_KEY = "unexa_saved_universities";
const COMPARED_UNIS_KEY = "unexa_compared_universities";
const JOINED_GROUPS_KEY = "unexa_joined_groups";
const AVATAR_KEY = "unexa_profile_avatar";
const COVER_KEY = "unexa_profile_cover";
const AUTH_KEY = "unexa_auth_user";
const MAX_COMPARE = 4;

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

  const [comparedUniversities, setComparedUniversities] = useState(() => {
    try {
      const stored = localStorage.getItem(COMPARED_UNIS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [joinedGroupIds, setJoinedGroupIds] = useState(() => {
    try {
      const stored = localStorage.getItem(JOINED_GROUPS_KEY);
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
      localStorage.setItem(COMPARED_UNIS_KEY, JSON.stringify(comparedUniversities));
    } catch {}
  }, [comparedUniversities]);

  useEffect(() => {
    try {
      localStorage.setItem(JOINED_GROUPS_KEY, JSON.stringify(joinedGroupIds));
    } catch {}
  }, [joinedGroupIds]);

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

  function addToCompare(uni) {
    if (comparedUniversities.some(u => u.id === uni.id)) {
      return "exists";
    }
    if (comparedUniversities.length >= MAX_COMPARE) {
      return "full";
    }
    setComparedUniversities(prev => [...prev, uni]);
    return "added";
  }

  function removeFromCompare(id) {
    setComparedUniversities(prev => prev.filter(u => u.id !== id));
  }

  function toggleJoinGroup(id) {
    setJoinedGroupIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleLogin(user) {
    setAuthUser(user);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch {}
  }

  async function handleLogout() {
    setAuthUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    await supabase.auth.signOut();
    navigate("/");
  }

  const userInitials = authUser?.name
    ? authUser.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <Routes>
      {/* ── Public: always reachable, regardless of login state ── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
      <Route path="/onboarding" element={<Onboarding onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* ── Authenticated app, lives under /app/* ── */}
      <Route
        path="/app/*"
        element={
          authUser ? (
            <div className="app">
              <Sidebar avatarUrl={avatarUrl} userInitials={userInitials} userName={authUser.name} />
              <main className="main">
                {selectedUni ? (
                  <UniversityDetail
                    uni={selectedUni}
                    onBack={() => setSelectedUni(null)}
                    savedUniversities={savedUniversities}
                    onToggleSave={toggleSaveUni}
                    comparedUniversities={comparedUniversities}
                    onAddToCompare={addToCompare}
                  />
                ) : (
                  <Routes>
                    <Route
                      index
                      element={
                        <Home
                          onSelectUni={setSelectedUni}
                          savedUniversities={savedUniversities}
                          onToggleSave={toggleSaveUni}
                          currentUser={authUser}
                          comparedUniversities={comparedUniversities}
                          onAddToCompare={addToCompare}
                          maxCompare={MAX_COMPARE}
                        />
                      }
                    />
                    <Route
                      path="dashboard"
                      element={
                        <Dashboard
                          comparedUniversities={comparedUniversities}
                          onRemove={removeFromCompare}
                          maxCompare={MAX_COMPARE}
                        />
                      }
                    />
                    <Route path="career-roadmap" element={<CareerRoadmap />} />
                    <Route
                      path="community"
                      element={
                        <Community
                          joinedGroupIds={joinedGroupIds}
                          onToggleJoin={toggleJoinGroup}
                        />
                      }
                    />
                    <Route
                      path="profile"
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
                    <Route path="*" element={<Navigate to="/app" replace />} />
                  </Routes>
                )}
              </main>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Anything else falls back to Landing */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}