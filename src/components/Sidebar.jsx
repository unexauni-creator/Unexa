import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/app", label: "Home", icon: "/home.svg" },
  { path: "/app/dashboard", label: "Dashboard", icon: "/chart.svg" },
  { path: "/app/career-roadmap", label: "Roadmap", icon: "/medal-star.svg" },
  { path: "/app/community", label: "Community", icon: "/messages.svg" },
];

export default function Sidebar({ avatarUrl, userInitials = "KD", userName = "Kateryna Dmyt..." }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <div className="logo">Unexa</div>
        <nav className="nav-group">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <img src={item.icon} alt="" className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <img src="/Menu.svg" alt="Menu" className="hamburger-icon" />
        </button>

        {/* Profile at bottom — clickable, goes to /app/profile */}
        <NavLink to="/app/profile" className="sidebar-bottom" style={{ textDecoration: "none" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="avatar-img avatar-img-photo" />
          ) : (
            <div className="avatar-img">{userInitials}</div>
          )}
          <div className="user-name">{userName}</div>
        </NavLink>
      </aside>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app"}
              className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <img src={item.icon} alt="" className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink to="/app/profile" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="avatar-img avatar-img-photo" style={{ width: 20, height: 20 }} />
            ) : (
              <div className="avatar-img" style={{ width: 20, height: 20, fontSize: 9 }}>{userInitials}</div>
            )}
            <span>{userName}</span>
          </NavLink>
        </div>
      )}
    </>
  );
}