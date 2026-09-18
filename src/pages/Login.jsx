import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const user = data.user;
    onLogin({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split("@")[0],
    });

    navigate("/");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Unexa</div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Log in to continue to Unexa.</p>

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

          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="login-footer">
          <span>Don't have an account?</span>
          <Link to="/signup" className="login-link">Sign up</Link>
        </div>

        <Link to="/login" className="login-back-link">← Back to home</Link>
      </div>
    </div>
  );
}
