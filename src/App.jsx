import React, { useRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LanguageTests from "./pages/LanguageTests";
import Community from "./pages/Community";
import "./styles/global.css";

function App() {
  const mainRef = useRef(null);
  const [scrolling, setScrolling] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handleScroll = () => {
      setScrolling(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setScrolling(false), 1000);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className={`main ${scrolling ? "is-scrolling" : ""}`} ref={mainRef}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/language-tests" element={<LanguageTests />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;