import { useState } from "react";
import Sidebar from "../components/Sidebar";
import HomeContent from "../components/HomeContent";
import "./Dashboard.css";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard">
      {sidebarOpen && <Sidebar />}
      <div className="main">
        <button
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <HomeContent />
      </div>
    </div>
  );
}

export default Dashboard;