import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      path: "/",
      label: "ホーム",
      icon: "🏠"
    },
    {
      path: "/books",
      label: "読書記録",
      icon: "📚"
    },
    {
      path: "/statistics",
      label: "統計",
      icon: "📈"
    },
    {
      path: "/want",
      label: "読みたい本",
      icon: "❤️"
    }
  ];

  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたみ'}
        >
          <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>
            {isCollapsed ? '»' : '«'}
          </span>
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {isActivePath(item.path) && (
              <span className="active-indicator"></span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
