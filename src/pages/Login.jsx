import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire up real auth
    console.log("Logging in with", email, password);
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

          <button type="submit" className="login-btn-primary">Log in</button>
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