// The moving parts of the landing page: the poster strip under the hero, the manifesto that fills
// with ink as you scroll, and the city that changes in the hero title.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

// Big rounded posters, like a gallery: Unexa illustrations mixed with real school photos.
const POSTERS = [
  { photo: "https://www.accademiavenezia.it/upload/eventi/crop/Mostra_Extra_Ordinario_Workshop_VII_Edizione.jpg", title: "Painting", sub: "Accademia di Belle Arti di Venezia", site: "accademiavenezia.it" },
  { photo: "https://www.risd.edu/themes/custom/risd_base_theme/src/patterns/pages/home/assets/HP_Asset_01-opt.jpg", title: "Graphic Design", sub: "Rhode Island School of Design", site: "risd.edu" },
  { photo: "https://www.eram.cat/wp-content/uploads/masteriniteractiondesign-eram02-scaled.jpg", title: "Interaction Design", sub: "ERAM · Girona", site: "eram.cat" },
  { photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Paris_6_-_ENSBA_01.jpg/1280px-Paris_6_-_ENSBA_01.jpg", title: "Fine Arts", sub: "Beaux-arts de Paris", site: "beauxartsparis.fr" },
  { photo: "https://assets.sva.edu/homepageStripSlideshow/144-sva-vap-selects-jermcohen-2025-1793011602.jpg", title: "Visual Arts", sub: "School of Visual Arts · New York", site: "sva.edu" },
  { photo: "https://www.ravensbourne.ac.uk/sites/default/files/2026-03/FIT_4865%201.jpg", title: "Fashion", sub: "Ravensbourne · London", site: "ravensbourne.ac.uk" },
  { photo: "https://www.geidai.ac.jp/english/wp-content/uploads/2024/10/H8A2884-Pano-scaled.jpg", title: "Global Arts", sub: "Tokyo University of the Arts", site: "geidai.ac.jp" },
  { photo: "https://assets.mica.edu/files/pages/wide_lrg_dsc07485-enhanced-nr-2.jpg", title: "Exhibitions", sub: "MICA · Baltimore", site: "mica.edu" },
  { photo: "https://www.ensad.fr/sites/default/files/styles/1920_auto/public/2024-10/Workshop%20DMU%20-%20Issy%20les%20Moulineaux%20%C2%A9Beryl%20Libault%20%2843%29.jpg?itok=WQOkLlEo", title: "Decorative Arts", sub: "École des Arts Décoratifs · Paris", site: "ensad.fr" },
  { photo: "https://arqa.com/wp-content/uploads/2023/11/01-hongik-university-seoul-campus-image-by-negativ-courtesy-of-oma.jpg", title: "Design", sub: "Hongik University · Seoul", site: "hongik.ac.kr" },
];

// the school's own icon from its website (via Google's favicon service); falls back to the ✳ mark
function SchoolLogo({ site }) {
  const [failed, setFailed] = useState(false);
  if (!site || failed) return <span className="ux-poster-mark" aria-hidden="true">✳</span>;
  return (
    <span className="ux-poster-logo" aria-hidden="true">
      <img src={`https://www.google.com/s2/favicons?domain=${site}&sz=128`} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

function Poster({ p }) {
  return (
    <article className="ux-poster">
      <div className="ux-poster-art" style={p.bg ? { background: p.bg } : undefined}>
        <img src={p.photo} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="ux-poster-cap">
        <SchoolLogo site={p.site} />
        <div>
          <b>{p.title}</b>
          <small>{p.sub}</small>
        </div>
      </div>
    </article>
  );
}

/** An endless, slowly moving strip of posters; hovering pauses it. */
export function PosterStrip() {
  return (
    <section className="ux-strip" aria-label="What you'll find on Unexa">
      <div className="ux-strip-row">
        {[...POSTERS, ...POSTERS].map((p, i) => <Poster key={i} p={p} />)}
      </div>
    </section>
  );
}

/** A paragraph that fills with ink word by word as it scrolls through the screen. */
export function Manifesto({ text }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <section className="ux-manifesto" ref={ref}>
      <p>
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </p>
    </section>
  );
}

function Word({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  const accent = word.startsWith("*");
  return <motion.span style={{ opacity }} className={accent ? "is-accent" : undefined}>{accent ? word.slice(1) : word} </motion.span>;
}

/** "Study art & design in Paris." The city changes every couple of seconds. */
export function CitySwap({ cities, delay = 0, index }) {
  const [own, setI] = useState(0);
  const i = index ?? own; // the hero can drive it, so the photo and the city change together
  useEffect(() => {
    if (index != null) return undefined;
    let id;
    const start = setTimeout(() => { id = setInterval(() => setI((n) => (n + 1) % cities.length), 2200); }, delay * 1000);
    return () => { clearTimeout(start); clearInterval(id); };
  }, [cities.length, delay, index]);
  return (
    <span className="ux-city">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={cities[i]} className="ux-city-word"
          initial={{ y: "70%", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-70%", opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: EASE }}>
          {cities[i]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
