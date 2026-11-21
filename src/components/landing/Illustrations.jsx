// Unexa's own illustration set for the landing page: the objects of studying art abroad, no characters.
// One style for all: flat shapes in the Unexa palette, a 2px ink outline, the ✳ as a recurring mark.
// Every piece loops gently, and only while it is on screen.
import { useId, useRef } from "react";
import { motion, useInView } from "framer-motion";

export const INK = "#2b1f18";
export const PALETTE = {
  brown: "#614E45", clay: "#AC8876", sand: "#E8DCCF", cream: "#FBF6EF", ochre: "#E2B97F",
  sage: "#A9B59B", lavender: "#C8C1DA", rose: "#E7B3A1", sky: "#B7CCD8", paper: "#FFFDF9",
};
const P = PALETTE;
const line = { stroke: INK, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

// animate only while visible (the poster strip has many pieces)
function useLive() {
  const ref = useRef(null);
  const live = useInView(ref, { margin: "120px" });
  return [ref, live];
}
const loop = (live, duration, extra = {}) => (live ? { duration, repeat: Infinity, ease: "easeInOut", ...extra } : { duration: 0 });

function Frame({ children, label, className = "", frameRef }) {
  return (
    <svg ref={frameRef} viewBox="0 0 240 240" className={`ux-illo ${className}`} role="img" aria-label={label} fill="none">
      {children}
    </svg>
  );
}

function Spark({ x, y, s = 1, color = INK, live, delay = 0 }) {
  return (
    <motion.text x={x} y={y} fontSize={22 * s} textAnchor="middle" dominantBaseline="central" fill={color}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      animate={live ? { rotate: [0, 90], scale: [1, 1.18, 1] } : { rotate: 0 }}
      transition={loop(live, 3.2, { delay })}>✳</motion.text>
  );
}

/** Sketchbook: an arch draws itself on the page while the pencil follows. */
export function Sketchbook() {
  const [ref, live] = useLive();
  return (
    <Frame frameRef={ref} label="Sketchbook">
        <rect x="46" y="58" width="150" height="132" rx="10" fill={P.paper} {...line} />
        <rect x="52" y="64" width="150" height="132" rx="10" fill="none" stroke={INK} strokeWidth="2" opacity="0.18" />
        {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={66 + i * 24} cy="58" r="6" fill={P.sand} {...line} />)}
        <motion.path d="M80 166 V122 a41 41 0 0 1 82 0 V166 M98 166 V128 a23 23 0 0 1 46 0 V166 M70 166 H172"
          {...line} strokeWidth="2.4"
          animate={{ pathLength: live ? [0, 1, 1, 0] : 1 }} transition={loop(live, 5, { times: [0, 0.55, 0.85, 1] })} />
        <motion.g animate={live ? { x: [0, 40, 72, 10, 0], y: [0, -46, 8, 20, 0] } : {}} transition={loop(live, 5)}>
          <g transform="translate(150 150) rotate(35)">
            <rect x="-6" y="-46" width="12" height="44" rx="2" fill={P.ochre} {...line} />
            <path d="M-6 -2 L0 12 L6 -2 Z" fill={P.sand} {...line} />
            <rect x="-6" y="-52" width="12" height="7" rx="2" fill={P.rose} {...line} />
          </g>
        </motion.g>
      </Frame>
  );
}

/** Paper plane on a dashed route between two pins. */
export function PaperPlane() {
  const [ref, live] = useLive();
  const route = "M40 178 C 80 120, 120 210, 160 120 S 206 62, 208 58";
  return (
    <Frame frameRef={ref} label="Paper plane">
        <circle cx="120" cy="124" r="78" fill={P.sky} opacity="0.55" />
        <path d={route} stroke={INK} strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity="0.45" />
        <motion.path d={route} {...line} strokeDasharray="2 8"
          animate={{ pathLength: live ? [0, 1] : 1 }} transition={loop(live, 3.6, { repeatDelay: 0.6 })} />
        <path d="M40 186 c-9 -10 -9 -24 0 -24 s9 14 0 24z" fill={P.clay} {...line} />
        <motion.g animate={live ? { x: [0, 6, 0], y: [0, -8, 0], rotate: [0, -6, 0] } : {}} transition={loop(live, 2.6)}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <path d="M168 66 L222 40 L196 96 L186 76 Z" fill={P.paper} {...line} />
          <path d="M186 76 L222 40 L180 70" {...line} fill={P.sand} />
        </motion.g>
        <Spark x="70" y="70" s={0.9} live={live} />
      </Frame>
  );
}

/** The school: a facade with columns; windows light up one by one, the flag waves. */
export function School() {
  const [ref, live] = useLive();
  return (
    <Frame frameRef={ref} label="Art school building">
        <path d="M44 96 L120 52 L196 96 Z" fill={P.clay} {...line} />
        <circle cx="120" cy="80" r="9" fill={P.paper} {...line} />
        <rect x="52" y="96" width="136" height="12" fill={P.sand} {...line} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={62 + i * 32} y="108" width="18" height="62" fill={P.paper} {...line} />
            <motion.rect x={66 + i * 32} y="120" width="10" height="16" rx="5" fill={P.ochre}
              animate={{ opacity: live ? [0.15, 1, 1, 0.15] : 1 }} transition={loop(live, 4, { delay: i * 0.5, times: [0, 0.2, 0.7, 1] })} />
          </g>
        ))}
        <rect x="46" y="170" width="148" height="10" fill={P.sand} {...line} />
        <rect x="38" y="180" width="164" height="12" rx="2" fill={P.brown} {...line} />
        <line x1="120" y1="52" x2="120" y2="22" {...line} />
        <motion.path d="M120 24 C 132 18, 140 30, 154 24 L154 40 C 140 46, 132 34, 120 40 Z" fill={P.rose} {...line}
          animate={live ? { d: ["M120 24 C 132 18, 140 30, 154 24 L154 40 C 140 46, 132 34, 120 40 Z", "M120 24 C 132 30, 140 18, 154 24 L154 40 C 140 34, 132 46, 120 40 Z", "M120 24 C 132 18, 140 30, 154 24 L154 40 C 140 46, 132 34, 120 40 Z"] } : {}}
          transition={loop(live, 2.4)} />
        <Spark x="200" y="62" s={0.8} live={live} />
      </Frame>
  );
}

/** Offer letter: the envelope opens and the letter rises with an ✳ seal. */
export function OfferLetter() {
  const [ref, live] = useLive();
  return (
    <Frame frameRef={ref} label="Offer letter">
        <rect x="52" y="112" width="136" height="88" rx="8" fill={P.sand} {...line} />
        <motion.g animate={live ? { y: [30, -26, -26, 30] } : { y: -26 }} transition={loop(live, 4.4, { times: [0, 0.35, 0.8, 1] })}>
          <rect x="66" y="78" width="108" height="96" rx="6" fill={P.paper} {...line} />
          <text x="120" y="102" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="13" fill={INK}>You're in!</text>
          <line x1="80" y1="118" x2="160" y2="118" {...line} opacity="0.35" />
          <line x1="80" y1="130" x2="148" y2="130" {...line} opacity="0.35" />
          <circle cx="150" cy="152" r="13" fill={P.clay} {...line} />
          <text x="150" y="153" textAnchor="middle" dominantBaseline="central" fontSize="14" fill={P.paper}>✳</text>
        </motion.g>
        <path d="M52 120 L120 162 L188 120 V192 a8 8 0 0 1 -8 8 H60 a8 8 0 0 1 -8 -8 Z" fill={P.ochre} {...line} />
        <Spark x="60" y="62" s={0.9} live={live} />
        <Spark x="190" y="80" s={0.6} live={live} delay={0.8} />
      </Frame>
  );
}

/** Calendar page: a date gets circled, again and again. */
export function Deadline() {
  const [ref, live] = useLive();
  return (
    <Frame frameRef={ref} label="Deadline on a calendar">
        <rect x="50" y="56" width="140" height="140" rx="12" fill={P.paper} {...line} />
        <path d="M50 68 a12 12 0 0 1 12 -12 H178 a12 12 0 0 1 12 12 V88 H50 Z" fill={P.rose} {...line} />
        <text x="120" y="77" textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="13" fill={INK}>JANUARY</text>
        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i} cx={70 + (i % 5) * 25} cy={104 + Math.floor(i / 5) * 22} r="3" fill={INK} opacity={i === 12 ? 0 : 0.25} />
        ))}
        <text x="120" y="148" textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="15" fill={INK}>15</text>
        <motion.path d="M106 140 C 104 128, 138 126, 138 146 C 138 162, 102 162, 102 146 C 102 138, 112 132, 124 134" {...line} stroke={P.clay} strokeWidth="3"
          animate={{ pathLength: live ? [0, 1, 1, 0] : 1 }} transition={loop(live, 3.8, { times: [0, 0.35, 0.85, 1] })} />
        <motion.g animate={live ? { rotate: [-8, 8, -8] } : {}} transition={loop(live, 3)} style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
          <line x1="120" y1="40" x2="120" y2="58" {...line} />
          <circle cx="120" cy="38" r="7" fill={P.clay} {...line} />
        </motion.g>
      </Frame>
  );
}

/** Passport: a stamp drops on the page. */
export function Passport() {
  const [ref, live] = useLive();
  return (
    <Frame frameRef={ref} label="Passport and visa stamp">
        <rect x="60" y="50" width="120" height="150" rx="10" fill={P.brown} {...line} />
        <rect x="70" y="60" width="100" height="130" rx="6" fill={P.paper} {...line} />
        <circle cx="120" cy="96" r="18" stroke={INK} strokeWidth="2" opacity="0.3" />
        <line x1="86" y1="132" x2="154" y2="132" {...line} opacity="0.3" />
        <line x1="86" y1="144" x2="140" y2="144" {...line} opacity="0.3" />
        <motion.g style={{ transformBox: "fill-box", transformOrigin: "center" }}
          animate={live ? { scale: [1.8, 1, 1, 1.8], opacity: [0, 1, 1, 0], rotate: [-30, -12, -12, -30] } : { scale: 1, opacity: 1, rotate: -12 }}
          transition={loop(live, 3.6, { times: [0, 0.18, 0.85, 1] })}>
          <rect x="112" y="146" width="70" height="40" rx="8" stroke={P.clay} strokeWidth="3" />
          <text x="147" y="166" textAnchor="middle" dominantBaseline="central" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="13" fill={P.clay}>VISA ✳</text>
        </motion.g>
      </Frame>
  );
}

/** Palette and brush: the paint blobs breathe, the brush paints a stroke. */
export function Palette() {
  const [ref, live] = useLive();
  const blobs = [[92, 104, P.rose], [124, 90, P.ochre], [156, 104, P.sage], [104, 140, P.sky]];
  return (
    <Frame frameRef={ref} label="Paint palette">
        <path d="M120 54 C 176 54, 206 92, 198 132 C 192 160, 166 150, 156 166 C 146 184, 160 200, 128 202 C 72 206, 36 170, 40 126 C 44 84, 76 54, 120 54 Z" fill={P.sand} {...line} />
        <circle cx="146" cy="146" r="11" fill={P.cream} {...line} />
        {blobs.map(([x, y, c], i) => (
          <motion.circle key={i} cx={x} cy={y} r="13" fill={c} {...line} style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={live ? { scale: [1, 1.15, 1] } : {}} transition={loop(live, 2.4, { delay: i * 0.3 })} />
        ))}
        <motion.g animate={live ? { rotate: [0, 14, 0] } : {}} transition={loop(live, 2.8)} style={{ transformBox: "fill-box", transformOrigin: "90% 90%" }}>
          <path d="M182 30 L206 54 L150 120 L138 108 Z" fill={P.ochre} {...line} />
          <path d="M138 108 L150 120 C 140 136, 118 138, 114 134 C 112 128, 122 116, 138 108 Z" fill={P.clay} {...line} />
        </motion.g>
      </Frame>
  );
}

/** Film strip that rolls by. */
export function FilmStrip() {
  const [ref, live] = useLive();
  const clip = `film-${useId().replace(/:/g, "")}`; // each copy needs its own clip id, or a hidden copy breaks the others
  const frames = [P.sky, P.rose, P.sage, P.ochre, P.lavender, P.sky, P.rose, P.sage];
  return (
    <Frame frameRef={ref} label="Film strip">
        <defs><clipPath id={clip}><rect x="30" y="80" width="180" height="84" rx="6" /></clipPath></defs>
        <rect x="30" y="80" width="180" height="84" rx="6" fill={INK} />
        <g clipPath={`url(#${clip})`}>
          <motion.g animate={live ? { x: [0, -88] } : {}} transition={loop(live, 2.4, { ease: "linear" })}>
            {frames.map((c, i) => (
              <g key={i}>
                <rect x={36 + i * 44} y="98" width="36" height="48" rx="4" fill={c} />
                <rect x={42 + i * 44} y="86" width="8" height="6" rx="1.5" fill={P.paper} />
                <rect x={58 + i * 44} y="86" width="8" height="6" rx="1.5" fill={P.paper} />
                <rect x={42 + i * 44} y="152" width="8" height="6" rx="1.5" fill={P.paper} />
                <rect x={58 + i * 44} y="152" width="8" height="6" rx="1.5" fill={P.paper} />
              </g>
            ))}
          </motion.g>
        </g>
        <rect x="30" y="80" width="180" height="84" rx="6" {...line} />
        <Spark x="190" y="54" s={0.9} live={live} />
        <Spark x="52" y="190" s={0.7} live={live} delay={1} />
      </Frame>
  );
}

/** Globe: the meridians turn and a pin bounces on it. */
export function Globe() {
  const [ref, live] = useLive();
  const clip = `globe-${useId().replace(/:/g, "")}`;
  return (
    <Frame frameRef={ref} label="Globe with a pin">
        <defs><clipPath id={clip}><circle cx="120" cy="128" r="70" /></clipPath></defs>
        <circle cx="120" cy="128" r="70" fill={P.sky} />
        <g clipPath={`url(#${clip})`}>
          <motion.g animate={live ? { x: [0, -70] } : {}} transition={loop(live, 6, { ease: "linear" })}>
            {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={64 + i * 70} cy="128" rx="34" ry="70" stroke={INK} strokeWidth="1.6" opacity="0.35" />)}
            <path d="M60 104 c20 -14 40 4 56 -6 s30 10 24 26 s-34 10 -50 4 s-34 -8 -30 -24z M150 150 c18 -8 36 4 30 18 s-30 12 -36 0z M210 104 c20 -14 40 4 56 -6 s30 10 24 26 s-34 10 -50 4 s-34 -8 -30 -24z" fill={P.sage} {...line} />
          </motion.g>
          <line x1="50" y1="128" x2="190" y2="128" stroke={INK} strokeWidth="1.6" opacity="0.35" />
        </g>
        <circle cx="120" cy="128" r="70" {...line} />
        <motion.g animate={live ? { y: [0, -14, 0] } : {}} transition={loop(live, 1.6)}>
          <path d="M148 92 c-12 -14 -12 -32 0 -32 s12 18 0 32z" fill={P.clay} {...line} />
          <circle cx="148" cy="72" r="4" fill={P.paper} />
        </motion.g>
      </Frame>
  );
}

export const ILLUSTRATIONS = { Sketchbook, PaperPlane, School, OfferLetter, Deadline, Passport, Palette, FilmStrip, Globe };
