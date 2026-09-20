import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/login.css";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // The reset-password link puts a recovery session in place automatically
    // (detectSessionInUrl) — just confirm a session actually exists before
    // letting the user set a new password.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-centered">
          <img src="/Unexa Logo.svg" alt="Unexa" className="login-logo-img" />
          <h1 className="login-title">Set a new password</h1>
          {!ready && !done && (
            <p className="login-subtitle">Verifying your reset link...</p>
          )}
          {done && (
            <p className="login-subtitle">Your password has been updated.</p>
          )}
        </div>

        {ready && !done && (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="password">New password</label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="login-input login-input-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>

            <label className="login-label" htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        {done && (
          <button type="button" className="login-btn-primary" onClick={() => navigate("/login")}>
            Go to login
          </button>
        )}

        {!ready && !done && (
          <p className="login-error" style={{ marginTop: 16 }}>
            If this doesn't load, the link may have expired — request a new one from{" "}
            <Link to="/forgot-password" className="login-link">here</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
