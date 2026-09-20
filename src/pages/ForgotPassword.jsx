import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-centered">
          <img src="/Unexa Logo.svg" alt="Unexa" className="login-logo-img" />
          <h1 className="login-title">Reset your password</h1>
          <p className="login-subtitle">
            {sent
              ? "Check your email for a link to reset your password."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {!sent && (
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

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="login-footer">
          <span>Remembered it after all?</span>
          <Link to="/login" className="login-link">Log in</Link>
        </div>

        <Link to="/" className="login-back-link">← Back to home</Link>
      </div>
    </div>
  );
}
