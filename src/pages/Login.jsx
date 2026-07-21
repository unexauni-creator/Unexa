import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in email and password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    onLogin({ name: name.trim() || email.split("@")[0], email: email.trim() });
    navigate("/");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Unexa</div>
        <div className="login-title">{mode === "signup" ? "Create your account" : "Welcome back"}</div>
        <div className="login-subtitle">
          {mode === "signup" ? "Start discovering universities in minutes." : "Log in to continue to Unexa."}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="login-field">
              <label className="login-label">Full name</label>
              <input className="login-input" value={name} onChange={e => setName(e.target.value)} placeholder="Kateryna Dmytrenko" />
            </div>
          )}
          <div className="login-field">
            <label className="login-label">Email</label>
            <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit-btn">
            {mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <div className="login-switch">
          {mode === "signup" ? (
            <>Already have an account? <button onClick={() => setMode("login")}>Log in</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setMode("signup")}>Sign up</button></>
          )}
        </div>

        <button className="login-back-btn" onClick={() => navigate("/landing")}>← Back to home</button>
      </div>
    </div>
  );
}