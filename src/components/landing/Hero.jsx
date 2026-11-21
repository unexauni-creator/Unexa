// Full-screen hero: photos of real schools on Unexa fill the screen, slowly zooming and fading into
// each other, with a big white title, one line and two buttons in the middle. A small caption at the
// bottom says which school is on screen.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";

const SLIDES = [
  { img: "https://www.accademiavenezia.it/upload/eventi/crop/Mostra_Extra_Ordinario_Workshop_VII_Edizione.jpg", school: "Accademia di Belle Arti di Venezia", city: "Venice" },
  { img: "https://www.eram.cat/wp-content/uploads/masteriniteractiondesign-eram02-scaled.jpg", school: "ERAM – University School of the Arts", city: "Girona" },
  { img: "https://assets.sva.edu/homepageStripSlideshow/144-sva-vap-selects-jermcohen-2025-1793011602.jpg", school: "School of Visual Arts", city: "New York" },
  { img: "https://www.ravensbourne.ac.uk/sites/default/files/2026-03/FIT_4865%201.jpg", school: "Ravensbourne University", city: "London" },
  { img: "https://assets.mica.edu/files/pages/wide_lrg_dsc07485-enhanced-nr-2.jpg", school: "Maryland Institute College of Art", city: "Baltimore" },
]
const SLIDE_MS = 5500;
const EASE = [0.22, 1, 0.36, 1];

export default function Hero({ delay = 0, onSignup }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const img = new Image(); img.src = SLIDES[(i + 1) % SLIDES.length].img; }, [i]);

  // the photo drifts and the text lifts away as you scroll past
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const textY = useTransform(scrollYProgress, [0, 0.7], [0, -90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  // leaving the hero: it shrinks into a rounded card and dims, so the next section takes over smoothly
  const frameScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const frameRadius = useTransform(scrollYProgress, [0, 0.4], [0, 44]);
  const dim = useTransform(scrollYProgress, (p) => `rgba(30,20,14,${Math.min(0.5, Math.max(0, p) * 0.7).toFixed(3)})`);

  const rise = (d) => ({ initial: { opacity: 0, y: 30, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 1, ease: EASE, delay: delay + d } });

  return (
    <section className="hf" id="showcase" ref={ref}>
      <motion.div className="hf-frame" style={{ scale: frameScale, borderRadius: frameRadius }}>
      <motion.div className="hf-bg" style={{ y: bgY }} aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.img key={i} src={SLIDES[i].img} alt=""
            initial={{ opacity: 0, scale: 1.14 }} animate={{ opacity: 1, scale: 1.02 }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4, ease: "easeInOut" }, scale: { duration: SLIDE_MS / 1000 + 1.4, ease: "linear" } }} />
        </AnimatePresence>
      </motion.div>
      <div className="hf-shade" aria-hidden="true" />
      <div className="hf-focus" aria-hidden="true" />
      <motion.div className="hf-dim" style={{ backgroundColor: dim }} aria-hidden="true" />

      <motion.div className="hf-content" style={{ y: textY, opacity: textOpacity }}>
        <motion.div className="hf-eyebrow" {...rise(0.1)}>Unexa · Art & design schools abroad</motion.div>
        <motion.h1 className="hf-title" {...rise(0.22)}>Find your<br />art school.</motion.h1>
        <motion.p className="hf-sub" {...rise(0.36)}>
          Fine art, design, film and architecture programmes around the world, straight from the schools' own websites.
        </motion.p>
        <motion.div className="hf-ctas" {...rise(0.5)}>
          <button type="button" className="hf-btn hf-btn-light" onClick={onSignup}>Create free account <span aria-hidden="true">↗</span></button>
          <a className="hf-btn hf-btn-dark" href="#how">See how it works</a>
        </motion.div>
      </motion.div>

      <div className="hf-caption" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE }}>
            {SLIDES[i].school} · {SLIDES[i].city}
          </motion.span>
        </AnimatePresence>
        <span className="hf-dots">{SLIDES.map((s, n) => <i key={s.school} className={n === i ? "on" : ""} />)}</span>
      </div>
      </motion.div>
    </section>
  );
}
