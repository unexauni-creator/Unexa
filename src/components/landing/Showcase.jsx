// The moving parts of the landing page: the poster strip under the hero, the manifesto that fills
// with ink as you scroll, and the city that changes in the hero title.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Sketchbook, PaperPlane, School, OfferLetter, Deadline, Passport, Palette, FilmStrip, Globe, PALETTE as C } from "./Illustrations";

const EASE = [0.22, 1, 0.36, 1];

// Big rounded posters, like a gallery: Unexa illustrations mixed with real school photos.
const POSTERS = [
  { Illo: Sketchbook, bg: C.sand, title: "Portfolio, page by page", sub: "15 works + 1 sketchbook" },
  { photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Paris_6_-_ENSBA_01.jpg/1280px-Paris_6_-_ENSBA_01.jpg", title: "Fine Arts (DNSAP)", sub: "Beaux-arts de Paris" },
  { Illo: Deadline, bg: "#F3DCD2", title: "Every deadline in one plan", sub: "Rhode Island School of Design · 5 Jan" },
  { Illo: PaperPlane, bg: "#DCE6EC", title: "One search, many countries", sub: "From Paris to Seoul" },
  { photo: "https://www.geidai.ac.jp/english/wp-content/uploads/2024/10/H8A2884-Pano-scaled.jpg", title: "Global Arts", sub: "Tokyo University of the Arts" },
  { Illo: School, bg: "#EFE3D3", title: "Straight from the source", sub: "Read from official school sites" },
  { Illo: OfferLetter, bg: "#F1E4C8", title: "The letter you're waiting for", sub: "Plan it, then open it" },
  { photo: "https://www.accademiavenezia.it/upload/eventi/crop/Mostra_Extra_Ordinario_Workshop_VII_Edizione.jpg", title: "Painting", sub: "Accademia di Belle Arti di Venezia" },
  { Illo: FilmStrip, bg: "#E2DEEA", title: "Film & Animation", sub: "Film, animation, media arts" },
  { Illo: Passport, bg: "#E4E8DD", title: "Visa & documents", sub: "What to send, and when" },
  { photo: "https://www.manchester.ac.uk/study/international/oxford-road-campus-shot-v2.webp", title: "Creative Writing", sub: "The University of Manchester" },
  { Illo: Palette, bg: "#F4E1D8", title: "Painting, design, film…", sub: "Creative programmes only" },
  { Illo: Globe, bg: "#DFE7E9", title: "Study where you dream", sub: "Europe, North America, East Asia" },
];

function Poster({ p }) {
  return (
    <article className="ux-poster">
      <div className="ux-poster-art" style={p.bg ? { background: p.bg } : undefined}>
        {p.photo ? <img src={p.photo} alt="" loading="lazy" decoding="async" /> : <p.Illo />}
      </div>
      <div className="ux-poster-cap">
        <span className="ux-poster-mark" aria-hidden="true">✳</span>
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
export function CitySwap({ cities, delay = 0 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let id;
    const start = setTimeout(() => { id = setInterval(() => setI((n) => (n + 1) % cities.length), 2200); }, delay * 1000);
    return () => { clearTimeout(start); clearInterval(id); };
  }, [cities.length, delay]);
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
