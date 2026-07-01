import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Home", icon: "/home.svg" },
  { path: "/dashboard", label: "Dashboard", icon: "/chart.svg" },
  { path: "/language-tests", label: "Language test", icon: "/medal-star.svg" },
  { path: "/community", label: "Community", icon: "/messages.svg" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">Unexa</div>
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
      <div className="sidebar-bottom">
        <div className="avatar-img">KD</div>
        <div className="user-name">Kateryna Dmyt...</div>
      </div>
    </aside>
  );
}