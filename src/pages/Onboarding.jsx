import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Mascot from "../components/Mascot";
import "../styles/onboarding.css";

const STEPS = [
  {
    key: "fields", column: "study_fields", type: "multi",
    title: "What would you love to study?",
    sub: "Choose every field that interests you.",
    hint: "Pick everything that sparks joy. You can choose more than one!",
    options: [
      "Graphic Design", "Product / UX Design", "Fine Arts", "Architecture",
      "Fashion Design", "Film & Animation", "Illustration", "Photography",
      "Interior Design", "Game Design", "Industrial Design", "Art History",
    ],
  },
  {
    key: "countries", column: "countries", type: "multi",
    title: "Where in the world?",
    sub: "Pick the countries you'd consider.",
    hint: "Dreaming of Paris, Seoul or Toronto? Choose every place you'd move to.",
    options: [
      "France", "Germany", "Italy", "Spain", "Poland", "Ukraine",
      "United Kingdom", "Canada", "United States", "South Korea", "Japan", "China",
    ],
  },
  {
    key: "level", column: "study_level", type: "single",
    title: "Which level are you aiming for?",
    sub: "Choose one.",
    hint: "Tell me where you're starting from and I'll match the right programs.",
    options: ["Bachelor", "Master", "Foundation year", "Short course / Summer school", "Not sure yet"],
  },
  {
    key: "intake", column: "start_year", type: "single",
    title: "When do you want to start?",
    sub: "Choose your ideal intake.",
    hint: "Application deadlines depend on the intake, so this helps me plan ahead.",
    options: ["Fall 2027", "Spring 2028", "Fall 2028", "2029 or later", "Not sure yet"],
  },
  {
    key: "languages", column: "languages", type: "multi",
    title: "Which languages can you study in?",
    sub: "Choose all that work for you.",
    hint: "No worries if it's more than one. Many programs are taught in two languages.",
    options: ["English", "French", "German", "Spanish", "Italian", "Polish", "Ukrainian", "Korean", "Happy to learn a new one"],
  },
  {
    key: "formats", column: "formats", type: "multi",
    title: "How do you want to study?",
    sub: "Choose every format you're open to.",
    hint: "On campus, online, or a mix. Whatever fits your life!",
    options: ["On campus", "Hybrid", "Online"],
  },
  {
    key: "budget", column: "budget", type: "single",
    title: "What's your yearly tuition budget?",
    sub: "Choose one. Scholarships can change the picture, so don't worry about being exact.",
    hint: "Tuition varies a lot. Pick the range you're comfortable with. Scholarships can change the picture, so no need to be exact!",
    options: ["Under $5,000", "$5,000 – $15,000", "$15,000 – $30,000", "Flexible, if there's a scholarship"],
  },
  {
    key: "priorities", column: "priorities", type: "multi", max: 3,
    title: "What matters most to you?",
    sub: "Choose up to three.",
    hint: "Last one! Pick up to three things that would make a program perfect for you.",
    options: [
      "Scholarships & funding", "Internships & industry links", "Easy admission process",
      "Strong alumni network", "Student community & city life", "Small classes",
      "Career outcomes", "Portfolio-friendly admission",
    ],
  },
];

const LAST_STEP = STEPS.length;
const MIN_PREPARING_MS = 3000;

const REACTIONS = ["Nice choice!", "Ooh, good one!", "Noted!", "Love it!", "Great pick!"];

const LOADING_MESSAGES = [
  "Hmm, let me match your interests...",
  "Checking programs in your countries...",
  "Filtering by language and budget...",
  "Almost there, putting your home page together...",
];

const EMPTY_ANSWERS = Object.fromEntries(
  STEPS.map((s) => [s.key, s.type === "multi" ? [] : ""])
);

function isAnswered(cfg, answers) {
  const v = answers[cfg.key];
  return cfg.type === "multi" ? v.length > 0 : Boolean(v);
}

function Chip({ label, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`ob-chip${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function Onboarding({ onLogin }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [isPreview, setIsPreview] = useState(false);

  const [step, setStep] = useState(0); // 0 = welcome, 1..LAST_STEP = questions
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);

  const [pulse, setPulse] = useState(0);
  const [reaction, setReaction] = useState("");
  const reactionTimer = useRef(null);

  const [preparing, setPreparing] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [saveError, setSaveError] = useState("");

  const navigate = useNavigate();

  // onLogin changes on every App render; reading it through a ref keeps this effect from
  // re-running (and re-fetching the session) in an endless loop.
  const onLoginRef = useRef(onLogin);
  onLoginRef.current = onLogin;

  useEffect(() => {
    async function loadSession() {
      // Local design preview (npm run dev only; skips Supabase and saving):
      //   /onboarding?preview=ready&step=3     /onboarding?preview=preparing
      const params = new URLSearchParams(window.location.search);
      const preview = params.get("preview");
      if (preview && import.meta.env.DEV) {
        setIsPreview(true);
        setName("Kateryna");
        if (preview === "preparing") {
          setStatus("ready");
          setPreparing(true);
        } else {
          setStatus(preview);
          setStep(Math.min(LAST_STEP, Math.max(0, Number(params.get("step")) || 0)));
        }
        return;
      }

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
      setUserId(user.id);
      setStatus("ready");

      onLoginRef.current({
        id: user.id,
        email: user.email,
        name: resolvedName,
      });
    }
    loadSession();
  }, []);

  // Rotate the loading messages while "preparing"
  useEffect(() => {
    if (!preparing) return undefined;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, [preparing]);

  useEffect(() => () => clearTimeout(reactionTimer.current), []);

  function say(text) {
    setReaction(text);
    clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => setReaction(""), 1600);
  }

  function choose(cfg, value) {
    const current = answers[cfg.key];

    if (cfg.type === "single") {
      setAnswers({ ...answers, [cfg.key]: value });
    } else if (current.includes(value)) {
      setAnswers({ ...answers, [cfg.key]: current.filter((v) => v !== value) });
    } else if (cfg.max && current.length >= cfg.max) {
      say(`Three is the limit. Unselect one to swap!`);
      return;
    } else {
      setAnswers({ ...answers, [cfg.key]: [...current, value] });
    }

    setPulse((p) => p + 1);
    say(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
  }

  function goTo(next) {
    clearTimeout(reactionTimer.current);
    setReaction("");
    setStep(next);
  }

  async function finish() {
    setSaveError("");
    setPreparing(true);

    // Keep the loading screen up for a minimum time so it never just flashes.
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_PREPARING_MS));

    let saveFailed = false;
    if (!isPreview && userId) {
      const payload = STEPS.reduce(
        (acc, s) => ({ ...acc, [s.column]: answers[s.key] }),
        { onboarding_completed: true }
      );
      // upsert: some accounts have no profiles row yet, and update would then silently save nothing
      const { error } = await supabase.from("profiles").upsert({ id: userId, full_name: name, ...payload });
      if (error) {
        console.error("Onboarding save failed:", error);
        saveFailed = true;
      }
    }

    await minDelay;

    if (isPreview) {
      onLogin({ id: "preview-user", email: "preview@unexa.app", name });
      navigate("/app");
      return;
    }

    if (saveFailed) {
      setPreparing(false);
      setSaveError("We couldn't save your answers. Please try again.");
      return;
    }
    navigate("/app");
  }

  function handleNext() {
    if (step < LAST_STEP) goTo(step + 1);
    else finish();
  }

  const cfg = step >= 1 ? STEPS[step - 1] : null;

  return (
    <div className="ob-page">
      <img src="/Unexa Logo.svg" alt="Unexa" className="ob-logo" />
      <div className="ob-card">

        {status === "loading" && (
          <div className="ob-center ob-fade">
            <h1 className="ob-title">Confirming your account...</h1>
            <p className="ob-sub">Just a moment.</p>
          </div>
        )}

        {status === "error" && (
          <div className="ob-center ob-fade">
            <h1 className="ob-title">Link expired or invalid</h1>
            <p className="ob-sub">Please log in to continue.</p>
            <button type="button" className="ob-btn ob-btn-primary ob-btn-solo" onClick={() => navigate("/login")}>
              Go to login
            </button>
          </div>
        )}

        {status === "ready" && preparing && (
          <div className="ob-center ob-fade" key="preparing">
            <div className="ob-bubble ob-bubble-below ob-fade" key={messageIndex} aria-live="polite">
              {LOADING_MESSAGES[messageIndex]}
              <span className="ob-dots" aria-hidden="true"><i /><i /><i /></span>
            </div>
            <Mascot size={150} mood="thinking" />
          </div>
        )}

        {status === "ready" && !preparing && step === 0 && (
          <div className="ob-center ob-fade" key="welcome">
            <div className="ob-bubble ob-bubble-below">
              <strong className="ob-bubble-title">Welcome, {name}!</strong>
              You verified your account. Now let&apos;s get to know you and your goals better.
            </div>
            <Mascot size={160} pulse={pulse} />
            <button type="button" className="ob-btn ob-btn-primary ob-btn-solo" onClick={() => goTo(1)}>
              Let&apos;s start
            </button>
          </div>
        )}

        {status === "ready" && !preparing && cfg && (
          <div className="ob-fade" key={step}>
            <div className="ob-progress" aria-label={`Step ${step} of ${LAST_STEP}`}>
              <div className="ob-progress-fill" style={{ width: `${(step / LAST_STEP) * 100}%` }} />
            </div>

            <div className="ob-guide">
              <Mascot size={112} pulse={pulse} />
              <div className="ob-bubble ob-fade" key={reaction || cfg.hint}>
                {reaction || cfg.hint}
              </div>
            </div>

            <div className="ob-step-head">
              <div className="ob-eyebrow">Question {step} of {LAST_STEP}</div>
              <h1 className="ob-title ob-title-left">{cfg.title}</h1>
            </div>

            <div className="ob-chips">
              {cfg.options.map((option) => {
                const value = answers[cfg.key];
                const selected = cfg.type === "multi" ? value.includes(option) : value === option;
                return (
                  <Chip
                    key={option}
                    label={option}
                    selected={selected}
                    onClick={() => choose(cfg, option)}
                  />
                );
              })}
            </div>

            {saveError && <p className="ob-error">{saveError}</p>}

            <div className="ob-actions">
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => goTo(step - 1)}>
                Back
              </button>
              <button
                type="button"
                className="ob-btn ob-btn-primary"
                onClick={handleNext}
                disabled={!isAnswered(cfg, answers)}
              >
                {step === LAST_STEP ? (saveError ? "Try again" : "Finish") : "Continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
