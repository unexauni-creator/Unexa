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

export default function Signup({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        // Confirmation email links land on /onboarding instead of the bare
        // root, so new users get a dedicated welcome step rather than
        // dropping onto Landing with no context.
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Redundant fallback for the case where a session exists immediately
    // (e.g. email confirmation disabled) — the profiles trigger already
    // handles the normal confirm-by-email path server-side.
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, full_name: name.trim() });

      if (profileError) {
        console.error("Couldn't save profile:", profileError.message);
      }
    }

    setLoading(false);

    if (data.session) {
      const user = data.user;
      onLogin({
        id: user.id,
        email: user.email,
        name: name.trim(),
      });
      navigate("/app");
    } else {
      setMessage("Check your email to confirm your account before logging in.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-centered">
          <img src="/Unexa Logo.svg" alt="Unexa" className="login-logo-img" />
          <h1 className="login-title">Create your account</h1>
          <p className="login-subtitle">Sign up to get started with Unexa.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            className="login-input"
            placeholder="Kateryna Dmytrenko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <label className="login-label" htmlFor="password">Password</label>
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

          <label className="login-label" htmlFor="confirmPassword">Confirm password</label>
          <div className="login-password-wrap">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="login-input login-input-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="login-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="login-link">Log in</Link>
        </div>

        <Link to="/" className="login-back-link">← Back to home</Link>
      </div>
    </div>
  );
}
