import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FlaskConical,
  LayoutDashboard,
  Package,
  Users,
  ReceiptText,
  PhoneCall,
  Database,
  Cloud,
  ArrowLeftRight,
  FileUp,
  FilePlus2,
  FileText,
  ClipboardList,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const menuGroups = [
  {
    label: "Main Menu",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/products", label: "Products Master", icon: Package },
      { to: "/clients", label: "Clients & Leads", icon: Users },
    ],
  },
  {
    label: "Sales",
    links: [
      { to: "/quotations/create", label: "Create Quotation", icon: FilePlus2, module: "quotations" },
      { to: "/quotations", label: "Quotations", icon: FileText, end: true },
      { to: "/po-management", label: "PO & Bill Management", icon: ClipboardList },
      { to: "/bills", label: "Bill Management", icon: ReceiptText },
    ],
  },
  {
    label: "Follow-ups",
    links: [{ to: "/follow-ups", label: "Call Status / Follow-ups", icon: PhoneCall }],
  },
];

const dataLinks = [
  { to: "/data-management/cloud-sync", label: "Cloud Sync", icon: Cloud },
  {
    to: "/data-management/import-export",
    label: "Import / Export",
    icon: ArrowLeftRight,
  },
  { to: "/data-management/csv-import", label: "CSV Import", icon: FileUp },
];

const adminLinks = [
  { to: "/admin/users", label: "User Management", icon: ShieldCheck },
];

export default function Sidebar() {
  const { mobileNavOpen, closeMobileNav, can } = useApp();
  /* Read-only accounts do not get the Create Quotation shortcut. */
  const groups = menuGroups.map((group) => ({
    ...group,
    links: group.links.filter(
      (link) => link.module !== "quotations" || can("quotations")
    ),
  }));
  const location = useLocation();
  const [dataOpen, setDataOpen] = useState(
    location.pathname.startsWith("/data-management")
  );

  const isDataActive = location.pathname.startsWith("/data-management");
  const classes = ["sidebar", mobileNavOpen ? "mobile-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {mobileNavOpen && (
        <div className="sidebar-overlay" onClick={closeMobileNav} aria-hidden="true" />
      )}
      <aside className={classes} aria-label="Main navigation">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <FlaskConical size={20} strokeWidth={2.2} />
          </span>
          <span className="brand-text">
            <span className="brand-name">V BIOCHEM</span>
            <span className="brand-sub">Advanced Software</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.links.map(({ to, label, icon: Icon, end }) => {
                /* Create Quotation also highlights while editing a quotation. */
                const forceActive =
                  to === "/quotations/create" &&
                  location.pathname.startsWith("/quotations/edit");
                return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `nav-item${isActive || forceActive ? " active" : ""}`
                  }
                  onClick={closeMobileNav}
                  title={label}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.1} />
                  </span>
                  <span>{label}</span>
                </NavLink>
                );
              })}
            </div>
          ))}

          <p className="nav-label">Administration</p>
          {adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
              onClick={closeMobileNav}
              title={label}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={2.1} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}

          <p className="nav-label">Data</p>
          <button
            type="button"
            className={`nav-item${isDataActive ? " active" : ""}`}
            onClick={() => setDataOpen((v) => !v)}
            aria-expanded={dataOpen}
            title="Data Management"
          >
            <span className="nav-icon" aria-hidden="true">
              <Database size={16} strokeWidth={2.1} />
            </span>
            <span>Data Management</span>
            <ChevronRight
              size={15}
              className={`nav-caret${dataOpen ? " open" : ""}`}
              aria-hidden="true"
            />
          </button>

          {dataOpen && (
            <div className="nav-sublist">
              {dataLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `nav-subitem${isActive ? " active" : ""}`
                  }
                  onClick={closeMobileNav}
                >
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <a
            className="visit-btn"
            href="https://vbiochem.example"
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight size={16} aria-hidden="true" />
            Visit Website
          </a>
        </div>
      </aside>
    </>
  );
}
