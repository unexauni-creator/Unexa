import { useEffect, useMemo, useRef } from "react";
import mascotRaw from "../assets/mascot.svg?raw";
import "../styles/mascot.css";

const MAX_X = 34;
const MAX_Y = 26;
const VIEW_W = 960;
const VIEW_H = 895;

// The artwork is untouched: we only crop the empty margins via viewBox and tag the two
// white ellipses (the pupils) so they can follow the cursor and blink.
function prepareSvg(raw) {
  return raw
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/g, "")
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, "")
    .replace(
      'width="100%" height="100%" viewBox="0 0 1357 922"',
      `width="100%" height="100%" viewBox="180 15 ${VIEW_W} ${VIEW_H}"`
    )
    .replace(/<ellipse /g, '<ellipse class="mascot-pupil" ');
}

export default function Mascot({ mood = "idle", pulse = 0, size = 110 }) {
  const wrapRef = useRef(null);
  const markup = useMemo(() => ({ __html: prepareSvg(mascotRaw) }), []);
  const stateRef = useRef({ tx: 0, ty: 0, x: 0, y: 0, nextBlink: 0, blinkStart: 0, happyUntil: 0 });
  const moodRef = useRef(mood);
  const firstPulse = useRef(true);

  function hop() {
    const el = wrapRef.current;
    if (!el) return;
    el.classList.remove("is-hop");
    void el.offsetWidth; // restart the animation
    el.classList.add("is-hop");
    stateRef.current.happyUntil = performance.now() + 900;
  }

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    if (firstPulse.current) {
      firstPulse.current = false;
      return;
    }
    hop();
  }, [pulse]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const pupils = el.querySelectorAll(".mascot-pupil");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = stateRef.current;
    s.nextBlink = performance.now() + 1800;

    function onPointer(e) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const range = Math.max(window.innerWidth, window.innerHeight) * 0.35;
      s.tx = Math.max(-1, Math.min(1, (e.clientX - cx) / range)) * MAX_X;
      s.ty = Math.max(-1, Math.min(1, (e.clientY - cy) / range)) * MAX_Y;
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    let raf;
    function frame(now) {
      if (now >= s.nextBlink) {
        s.blinkStart = now;
        s.nextBlink = now + 2200 + Math.random() * 3200;
      }
      let blink = 0;
      if (s.blinkStart && now - s.blinkStart < 170) {
        blink = Math.sin(((now - s.blinkStart) / 170) * Math.PI);
      }

      let tx = s.tx;
      let ty = s.ty;
      if (moodRef.current === "excited") {
        tx = Math.sin(now / 260) * MAX_X;
        ty = Math.cos(now / 330) * MAX_Y * 0.7;
      } else if (moodRef.current === "thinking") {
        tx = -MAX_X * 0.55 + Math.sin(now / 900) * 10;
        ty = -MAX_Y * 0.9 + Math.cos(now / 1300) * 5;
      }
      s.x += (tx - s.x) * 0.14;
      s.y += (ty - s.y) * 0.14;

      const grow = now < s.happyUntil ? 1.18 : 1;
      const transform = `translate(${s.x}px, ${s.y}px) scale(${grow}, ${grow * (1 - 0.9 * blink)})`;
      pupils.forEach((p) => {
        p.style.transform = transform;
      });
      raf = requestAnimationFrame(frame);
    }
    if (!reduce) raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`mascot${mood === "excited" ? " is-excited" : ""}${mood === "thinking" ? " is-thinking" : ""}`}
      style={{ width: size, height: (size * VIEW_H) / VIEW_W }}
      onClick={hop}
      role="img"
      aria-label="Unexa mascot"
      dangerouslySetInnerHTML={markup}
    />
  );
}
