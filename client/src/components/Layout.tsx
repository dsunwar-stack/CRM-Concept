import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Schemas", end: true },
  { to: "/agent-workspace", label: "AI Case Assistant" },
  { to: "/triage", label: "Triage Map" },
  { to: "/audit-log", label: "Audit Log" },
  { to: "/data-policy", label: "Data & Security" },
];

export default function Layout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="slds-align_absolute-center" style={{ minHeight: "100vh" }}>
        <p className="slds-text-color_weak">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <div className="slds-global-header_container">
        <header className="slds-global-header slds-grid slds-grid_align-spread">
          <div className="slds-global-header__item">
            <div className="slds-global-header__logo slds-show_inline-block slds-p-horizontal_small slds-text-heading_small">
              ☁ Caseflow
            </div>
          </div>
          <div className="slds-global-header__item">
            <ul className="slds-global-actions">
              <li className="slds-global-actions__item slds-global-actions__avatar">
                <div className="slds-global-actions__item-action slds-grid slds-grid_vertical-align-center">
                  <span className="slds-avatar slds-avatar_circle slds-avatar_medium">
                    <span className="slds-avatar__initials">{initials}</span>
                  </span>
                  <span className="slds-p-left_x-small slds-text-align_left">
                    <span className="slds-text-body_small slds-line-height_reset">{user.name}</span>
                    <br />
                    <span className="slds-text-body_small slds-text-color_weak slds-text-title_caps">
                      {user.role}
                    </span>
                  </span>
                </div>
              </li>
              <li className="slds-global-actions__item">
                <button className="slds-button slds-button_neutral" onClick={logout}>
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        </header>
      </div>

      <div className="slds-context-bar" style={{ marginTop: "var(--slds-s-header-sizing-height, 3.125rem)" }}>
        <div className="slds-context-bar__primary slds-grid">
          <div className="slds-context-bar__item slds-context-bar__app-name">
            <span className="slds-context-bar__label-action">
              <span className="slds-truncate">Caseflow</span>
            </span>
          </div>
        </div>
        <nav className="slds-context-bar__secondary slds-grid" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `slds-context-bar__item slds-context-bar__item_tab ${isActive ? "slds-is-active" : ""}`
              }
            >
              <span className="slds-context-bar__label-action">
                <span className="slds-truncate">{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="slds-p-around_medium" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
