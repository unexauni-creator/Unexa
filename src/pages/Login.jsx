import { useState } from "react";
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

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in email and password.");
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const user = data.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Couldn't load profile:", profileError.message);
    }

    setLoading(false);

    onLogin({
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.email.split("@")[0],
    });
    navigate("/app");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-centered">
          <img src="/Unexa Logo.svg" alt="Unexa" className="login-logo-img" />
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Log in to continue to Unexa.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="login-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="login-label-row">
            <label className="login-label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="login-forgot-link">Forgot password?</Link>
          </div>
          <div className="login-password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="login-input login-input-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="login-footer">
          <span>Don't have an account?</span>
          <Link to="/signup" className="login-link">Sign up</Link>
        </div>

        <Link to="/" className="login-back-link">← Back to home</Link>
      </div>
    </div>
  );
}
