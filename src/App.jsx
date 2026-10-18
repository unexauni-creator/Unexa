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
import { mapSpecialty } from "./lib/mapSpecialty.js";
import "./styles/base.css";
import "./styles/community.css";
import "./styles/landing.css";
import "./styles/profile.css";
import Onboarding from "./pages/Onboarding";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Saved universities used to live only in this browser; this key is now read once
// to import them into the account, then removed.
const LEGACY_SAVED_KEY = "unexa_saved_universities";
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

  const [savedUniversities, setSavedUniversities] = useState([]);
  const [savedLoading, setSavedLoading] = useState(() => Boolean(authUser?.id));

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

  // Saved universities live in the account (table: saved_universities).
  // Load them whenever the signed-in user changes; clear them on logout.
  useEffect(() => {
    if (!authUser?.id) {
      setSavedUniversities([]);
      setSavedLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSaved() {
      setSavedLoading(true);

      // One-time import of saves made before they were stored in the account.
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_SAVED_KEY) || "[]");
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map(u => ({ user_id: authUser.id, specialty_id: String(u.id) }));
          const { error: importError } = await supabase
            .from("saved_universities")
            .upsert(rows, { onConflict: "user_id,specialty_id", ignoreDuplicates: true });
          if (!importError) localStorage.removeItem(LEGACY_SAVED_KEY);
        } else {
          localStorage.removeItem(LEGACY_SAVED_KEY);
        }
      } catch {}

      const { data: rows, error } = await supabase
        .from("saved_universities")
        .select("specialty_id")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error("Couldn't load saved universities:", error.message);
        setSavedLoading(false);
        return;
      }

      const ids = rows.map(r => r.specialty_id);
      if (ids.length === 0) {
        setSavedUniversities([]);
        setSavedLoading(false);
        return;
      }

      const { data: specs, error: specsError } = await supabase
        .from("specialties")
        .select("*, universities(*)")
        .in("id", ids);

      if (cancelled) return;
      if (specsError) {
        console.error("Couldn't load saved university details:", specsError.message);
        setSavedLoading(false);
        return;
      }

      const byId = new Map(specs.map(spec => [String(spec.id), mapSpecialty(spec)]));
      setSavedUniversities(ids.map(id => byId.get(id)).filter(Boolean));
      setSavedLoading(false);
    }

    loadSaved();
    return () => { cancelled = true; };
  }, [authUser?.id]);

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

  async function toggleSaveUni(uni) {
    if (!authUser?.id) return;

    const wasSaved = savedUniversities.some(u => u.id === uni.id);
    const specialtyId = String(uni.id);

    // Update the UI right away, then sync with the account.
    setSavedUniversities(prev =>
      wasSaved ? prev.filter(u => u.id !== uni.id) : [...prev, uni]
    );

    const { error } = wasSaved
      ? await supabase
          .from("saved_universities")
          .delete()
          .eq("user_id", authUser.id)
          .eq("specialty_id", specialtyId)
      : await supabase
          .from("saved_universities")
          .upsert(
            { user_id: authUser.id, specialty_id: specialtyId },
            { onConflict: "user_id,specialty_id", ignoreDuplicates: true }
          );

    if (error) {
      console.error("Couldn't update saved universities:", error.message);
      // Roll the UI back so it matches what's actually stored.
      setSavedUniversities(prev =>
        wasSaved
          ? (prev.some(u => u.id === uni.id) ? prev : [...prev, uni])
          : prev.filter(u => u.id !== uni.id)
      );
    }
  }

  function addToCompare(uni) {
    let result = "added";
    setComparedUniversities(prev => {
      if (prev.some(u => u.id === uni.id)) {
        result = "exists";
        return prev;
      }
      if (prev.length >= MAX_COMPARE) {
        result = "full";
        return prev;
      }
      return [...prev, uni];
    });
    return result;
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
                          savedLoading={savedLoading}
                          onToggleSave={toggleSaveUni}
                          onSelectUni={setSelectedUni}
                          avatarUrl={avatarUrl}
                          coverUrl={coverUrl}
                          onAvatarChange={setAvatarUrl}
                          onCoverChange={setCoverUrl}
                          userName={authUser.name}
                          onLogout={handleLogout}
                        />
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <Home
                          onSelectUni={setSelectedUni}
                          savedUniversities={savedUniversities}
                          onToggleSave={toggleSaveUni}
                          currentUser={authUser}
                        />
                      }
                    />
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