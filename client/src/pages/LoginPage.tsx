import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Standard user (PM / analyst)", email: "analyst@demo.caseflow.app", password: "demo1234" },
  { label: "Expert user (override rights)", email: "expert@demo.caseflow.app", password: "demo1234" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="slds-align_absolute-center"
      style={{ minHeight: "100vh", background: "var(--slds-g-color-neutral-base-95)" }}
    >
      <div className="slds-card" style={{ width: "100%", maxWidth: 420 }}>
        <div className="slds-card__body slds-card__body_inner slds-p-around_large">
          <div className="slds-media slds-media_center slds-p-bottom_medium">
            <div className="slds-media__figure">
              <span className="slds-icon_container slds-icon-standard-case" title="Caseflow">
                ☁
              </span>
            </div>
            <div className="slds-media__body">
              <h1 className="slds-text-heading_medium">Caseflow</h1>
              <p className="slds-text-body_small slds-text-color_weak">
                Consistent case screens, visible bottlenecks
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label" htmlFor="login-email">
                Email
              </label>
              <div className="slds-form-element__control">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="slds-input"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div className="slds-form-element slds-m-bottom_small">
              <label className="slds-form-element__label" htmlFor="login-password">
                Password
              </label>
              <div className="slds-form-element__control">
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="slds-input"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && (
              <div className="slds-form-element slds-m-bottom_small">
                <p className="slds-text-color_error slds-text-body_small">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="slds-button slds-button_brand slds-button_stretch"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="slds-box slds-theme_shade slds-m-top_medium">
            <p className="slds-text-title_caps slds-text-color_weak slds-m-bottom_x-small">
              Demo accounts
            </p>
            <ul className="slds-list_vertical-space">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                    }}
                    className="slds-button slds-button_reset slds-text-align_left"
                  >
                    <span className="slds-text-body_small">
                      <span className="slds-text-color_default">{acc.label}:</span>{" "}
                      <span className="slds-text-color_weak">
                        {acc.email} / {acc.password}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
