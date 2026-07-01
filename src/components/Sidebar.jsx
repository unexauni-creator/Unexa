import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Home", icon: "/home.svg" },
  { path: "/dashboard", label: "Dashboard", icon: "/chart.svg" },
  { path: "/language-tests", label: "Language test", icon: "/medal-star.svg" },
  { path: "/community", label: "Community", icon: "/messages.svg" },
];

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <div className="logo">Unexa</div>

        {/* Desktop nav */}
        <nav className="nav-group">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <img src={item.icon} alt="" className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <img src="/Menu.svg" alt="Menu" className="hamburger-icon" />
        </button>

        <div className="sidebar-bottom">
          <div className="avatar-img">KD</div>
          <div className="user-name">Kateryna Dmyt...</div>
        </div>
      </aside>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <img src={item.icon} alt="" className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}