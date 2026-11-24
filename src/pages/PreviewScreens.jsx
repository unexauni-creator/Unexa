// Real Unexa screens for the landing page, filled with a snapshot of real programmes from the database
// (src/lib/demoPrograms.json). They render the app's own components, so the landing always shows the
// product as it really looks. Shown at 1440×900 inside an iframe and scaled down; nothing is saved.
import { useState } from "react";
import Home from "./Home";
import Dashboard from "./Dashboard";
import CareerRoadmap from "./CareerRoadmap";
import UniversityDetail from "./UniversityDetail";
import Dorm from "./Dorm";
import demo from "../lib/demoPrograms.json";

const NAV = [
  { key: "home", label: "Home", icon: "/home.svg" },
  { key: "dashboard", label: "Dashboard", icon: "/chart.svg" },
  { key: "roadmap", label: "Roadmap", icon: "/medal-star.svg" },
  { key: "community", label: "Community", icon: "/messages.svg" },
];
const noop = () => {};

function Shell({ active, children }) {
  return (
    <div className="app preview-still" aria-hidden="true">
      <aside className="sidebar">
        <div className="logo">Unexa</div>
        <nav className="nav-group">
          {NAV.map((n) => (
            <span key={n.key} className={`nav-item ${n.key === active ? "active" : ""}`}>
              <img src={n.icon} alt="" className="nav-icon" />
              <span>{n.label}</span>
            </span>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar-img">LM</div>
          <div className="user-name">Lina Moreau</div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function PreviewDashboard() {
  const compared = demo.slice(0, 3);
  return (
    <Shell active="dashboard">
      <Dashboard comparedUniversities={compared} savedUniversities={compared} maxCompare={4}
        onRemove={noop} onAdd={noop} onToggleSave={noop} onAddToCompare={noop} onRestore={noop} onDeleteHistory={noop} />
    </Shell>
  );
}

export function PreviewRoadmap() {
  return (
    <Shell active="roadmap">
      <CareerRoadmap savedUniversities={demo} onSelectUni={noop} onToggleSave={noop} />
    </Shell>
  );
}

export function PreviewDetail() {
  const want = new URLSearchParams(window.location.search).get("school") || "Rhode Island";
  const uni = demo.find((p) => p.name.toLowerCase().includes(want.toLowerCase())) ?? demo[0];
  return (
    <Shell active="home">
      <UniversityDetail uni={uni} onBack={noop} savedUniversities={[uni]} onToggleSave={noop} comparedUniversities={[]} onAddToCompare={noop} />
    </Shell>
  );
}

export function PreviewDorm() {
  const uni = demo.find((p) => p.housing?.options?.length) ?? demo[0];
  return (
    <Shell active="home">
      <div className="home-page"><Dorm uni={uni} onBack={noop} /></div>
    </Shell>
  );
}

// local test page only (/dev/roadmap): the real Roadmap at any screen size, without the fixed 1440 frame
export function DevRoadmap() {
  return (
    <div className="app">
      <main className="main">
        <CareerRoadmap savedUniversities={demo} onSelectUni={noop} onToggleSave={noop} />
      </main>
    </div>
  );
}

// local test page only (/dev/detail?school=…): a school page at any screen size
export function DevDetail() {
  const want = new URLSearchParams(window.location.search).get("school") || "Weißensee";
  const uni = demo.find((p) => p.name.toLowerCase().includes(want.toLowerCase())) ?? demo.find((p) => p.faculty?.people?.length) ?? demo[0];
  return (
    <div className="app">
      <main className="main">
        <UniversityDetail uni={uni} onBack={noop} savedUniversities={[uni]} onToggleSave={noop} comparedUniversities={[]} onAddToCompare={noop} />
      </main>
    </div>
  );
}

// local test page only (/dev/home): Home with a school opening over it, the same way the real app does
export function DevHomeFlow() {
  const [uni, setUni] = useState(null);
  return (
    <div className="app">
      <main className="main">
        {uni && <UniversityDetail uni={uni} onBack={() => setUni(null)} savedUniversities={[]} onToggleSave={noop} comparedUniversities={[]} onAddToCompare={noop} />}
        <div className="main-view" style={uni ? { display: "none" } : undefined}>
          <Home active={!uni} onSelectUni={setUni} savedUniversities={[]} onToggleSave={noop} currentUser={{ name: "Lina" }} demoProfile={{ study_fields: ["Graphic Design", "Illustration"], countries: ["Italy", "Germany"], study_level: "Bachelor" }} />
        </div>
      </main>
    </div>
  );
}
