import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Physics", path: "/quiz/physics" },
    { label: "Chemistry", path: "/quiz/chemistry" },
    { label: "Mathematics", path: "/quiz/mathematics" },
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <h2 className="logo">Socratic Mirror</h2>

      <ul>
        {navItems.map((item) => (
          <li
            key={item.path}
            className={isActive(item.path) ? "active" : ""}
            onClick={() => handleNavClick(item.path)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;