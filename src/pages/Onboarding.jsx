import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/login.css";

export default function Onboarding({ onLogin }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSession() {
      // supabase-js auto-parses the confirmation link's tokens and
      // establishes a session before this component mounts (detectSessionInUrl
      // is on by default), so a plain getSession() call is enough here.
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setStatus("error");
        return;
      }

      const user = data.session.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const resolvedName = profile?.full_name || user.email.split("@")[0];
      setName(resolvedName);
      setStatus("ready");

      onLogin({
        id: user.id,
        email: user.email,
        name: resolvedName,
      });
    }
    loadSession();
  }, [onLogin]);

  function handleContinue() {
    navigate("/app");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-centered">
          <img src="/Unexa Logo.svg" alt="Unexa" className="login-logo-img" />

          {status === "loading" && (
            <>
              <h1 className="login-title">Confirming your account...</h1>
              <p className="login-subtitle">Just a moment.</p>
            </>
          )}

          {status === "ready" && (
            <>
              <h1 className="login-title">Welcome, {name}!</h1>
              <p className="login-subtitle">Your email is confirmed and your account is ready.</p>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="login-title">Link expired or invalid</h1>
              <p className="login-subtitle">Please log in to continue.</p>
            </>
          )}
        </div>

        {status === "ready" && (
          <button type="button" className="login-btn-primary" onClick={handleContinue}>
            Continue to Unexa
          </button>
        )}

        {status === "error" && (
          <button type="button" className="login-btn-primary" onClick={() => navigate("/login")}>
            Go to login
          </button>
        )}
      </div>
    </div>
  );
}
