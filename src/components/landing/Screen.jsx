// A real Unexa screen in a browser window: the page is rendered at 1440×900 in an iframe and scaled
// to fit, so it looks exactly like the app at any size. It only loads when it comes near the screen.
import { useEffect, useRef, useState } from "react";

export default function Screen({ src, label = "unexa.app" }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1440));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "600px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);
  return (
    <div className="scr">
      <div className="scr-bar"><i /><i /><i /><span>{label}</span></div>
      <div className="scr-view" ref={box}>
        {near && <iframe src={src} title={label} tabIndex={-1} aria-hidden="true" style={{ transform: `scale(${scale})` }} />}
      </div>
    </div>
  );
}
