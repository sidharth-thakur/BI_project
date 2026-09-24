import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Globe,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Topbar() {
  const navigate = useNavigate();
  const { openMobileNav, globalSearch, setGlobalSearch, user } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  /* Ctrl/Cmd + K still focuses search, but the control stays compact */
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setUserMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onClick(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn menu-toggle"
          onClick={openMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        <div className="topbar-search">
          <div className="search-input">
            <Search size={16} />
            <input
              ref={searchRef}
              type="search"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search clients, products, bills..."
              aria-label="Search"
            />
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="icon-btn"
          aria-label="Notifications, 5 unread"
        >
          <Bell size={18} />
          <span className="notification-dot">5</span>
        </button>

        <button type="button" className="lang-pill" aria-label="Language: English">
          <Globe size={15} aria-hidden="true" />
          EN
        </button>

        <div className="dropdown" ref={userMenuRef}>
          <button
            type="button"
            className="topbar-user"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="avatar sm" aria-hidden="true">
              {user.initials}
            </span>
            <span className="user-name">{user.name}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {userMenuOpen && (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-item" style={{ cursor: "default" }}>
                <User size={15} />
                <span>
                  <strong>{user.fullName}</strong>
                  <br />
                  <small className="text-muted">{user.role}</small>
                </span>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item danger"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  /* Local-only logout: no backend session exists yet. */
                  navigate("/dashboard");
                }}
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
