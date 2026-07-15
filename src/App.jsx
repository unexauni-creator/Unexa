import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CareerRoadmap from "./pages/CareerRoadmap";
import Community from "./pages/Community";
import UniversityDetail from "./pages/UniversityDetail";
import Profile from "./pages/Profile";
import "./styles/base.css";

export default function App() {
  const [selectedUni, setSelectedUni] = useState(null);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        {selectedUni ? (
          <UniversityDetail uni={selectedUni} onBack={() => setSelectedUni(null)} />
        ) : (
          <Routes>
            <Route path="/" element={<Home onSelectUni={setSelectedUni} />} />
            <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/career-roadmap" element={<CareerRoadmap />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        )}
      </main>
    </div>
  );
}