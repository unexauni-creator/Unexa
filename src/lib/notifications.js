// Notifications built from real data (no extra tables needed):
//  - new programmes / universities added in the last NEW_DAYS days (specialties.created_at)
//  - application deadlines of SAVED programmes within DEADLINE_DAYS days
//  - tips (e.g. nothing saved yet)
// Read state and preferences live in localStorage, per user.

const NEW_DAYS = 30;
const DEADLINE_DAYS = 45;
export const PREFS_KEY = "unexa_notif_prefs";
export const DEFAULT_PREFS = { newUni: true, deadlines: true, tips: true };

export function loadPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; }
  catch { return { ...DEFAULT_PREFS }; }
}
export function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
  window.dispatchEvent(new Event("unexa-notif-prefs"));
}

const readKey = (userId) => `unexa_notif_read_${userId || "guest"}`;
export function loadRead(userId) {
  try { return new Set(JSON.parse(localStorage.getItem(readKey(userId)) || "[]")); }
  catch { return new Set(); }
}
export function saveRead(userId, set) {
  try { localStorage.setItem(readKey(userId), JSON.stringify([...set].slice(-500))); } catch {}
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const FR = { janv: 0, fevr: 1, mars: 2, avr: 3, mai: 4, juin: 5, juil: 6, aout: 7, sept: 8, oct: 9, nov: 10, dec: 11 };

function monthIndex(word) {
  const w = word.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const en = MONTHS.indexOf(w.slice(0, 3));
  if (en >= 0) return en;
  for (const [k, v] of Object.entries(FR)) if (w.startsWith(k)) return v;
  return -1;
}

// Finds all dates in free text like "15 January 2027", "January 15", "2027-01-15", "15/01/2027".
export function parseDates(text, now = new Date()) {
  if (!text) return [];
  const s = String(text);
  const found = [];
  const add = (y, m, d) => {
    if (m < 0 || m > 11 || d < 1 || d > 31) return;
    let date = new Date(y ?? now.getFullYear(), m, d, 23, 59);
    // no year given → the next time that date comes around
    if (y == null && date < startOfDay(now)) date = new Date(now.getFullYear() + 1, m, d, 23, 59);
    found.push(date);
  };
  for (const m of s.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})/g)) add(+m[1], +m[2] - 1, +m[3]);
  for (const m of s.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/g)) add(+m[3], +m[2] - 1, +m[1]);
  for (const m of s.matchAll(/\b(\d{1,2})(?:st|nd|rd|th|er)?\s+([A-Za-zÀ-ÿ]{3,})\.?,?\s*(\d{4})?/g)) {
    const mi = monthIndex(m[2]);
    if (mi >= 0) add(m[3] ? +m[3] : null, mi, +m[1]);
  }
  for (const m of s.matchAll(/\b([A-Za-zÀ-ÿ]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/g)) {
    const mi = monthIndex(m[1]);
    if (mi >= 0) add(m[3] ? +m[3] : null, mi, +m[2]);
  }
  return found;
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY = 86400000;

export function timeAgo(date, now = new Date()) {
  const diff = Math.max(0, now - date);
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * @param {object[]} programs  all programme cards (mapSpecialty output, with createdAt)
 * @param {object[]} saved     saved programme cards
 * @param {object}   prefs     {newUni, deadlines, tips}
 */
export function buildNotifications(programs, saved, prefs = DEFAULT_PREFS, now = new Date()) {
  const list = [];

  if (prefs.newUni) {
    // group recent programmes by university: "ENSAD added 5 programmes"
    const byUni = new Map();
    for (const p of programs) {
      const created = p.createdAt ? new Date(p.createdAt) : null;
      if (!created || now - created > NEW_DAYS * DAY) continue;
      const g = byUni.get(p.universityId) ?? { uni: p, items: [], latest: created, uniCreated: p.universityCreatedAt ? new Date(p.universityCreatedAt) : null };
      g.items.push(p);
      if (created > g.latest) g.latest = created;
      byUni.set(p.universityId, g);
    }
    for (const g of byUni.values()) {
      const isNewUni = g.uniCreated && now - g.uniCreated <= NEW_DAYS * DAY;
      const n = g.items.length;
      list.push({
        id: `new-${g.uni.universityId}-${n}`,
        type: "new",
        icon: "🏛️",
        title: isNewUni ? "New university added!" : `${n} new program${n > 1 ? "s" : ""}`,
        desc: isNewUni
          ? `${g.uni.name} joined Unexa with ${n} program${n > 1 ? "s" : ""} — explore them.`
          : `${g.uni.name}: ${g.items.slice(0, 3).map((p) => p.program).join(", ")}${n > 3 ? "…" : ""}`,
        date: g.latest,
        target: g.items[0],
        search: g.uni.name,
      });
    }
  }

  if (prefs.deadlines) {
    for (const p of saved) {
      const upcoming = parseDates(p.applicationDeadline, now)
        .filter((d) => d >= startOfDay(now) && d - now <= DEADLINE_DAYS * DAY)
        .sort((a, b) => a - b)[0];
      if (!upcoming) continue;
      const days = Math.ceil((startOfDay(upcoming) - startOfDay(now)) / DAY);
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      list.push({
        id: `deadline-${p.id}-${upcoming.toISOString().slice(0, 10)}`,
        type: "deadline",
        icon: days <= 7 ? "⏰" : "📋",
        title: days <= 7 ? "Application deadline soon" : "Upcoming deadline",
        desc: `${p.program} at ${p.name} closes applications ${when} (${upcoming.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}).`,
        // shown as "fresh" a little before the deadline window
        date: new Date(Math.min(now, upcoming - 7 * DAY)),
        target: p,
        urgent: days <= 7,
      });
    }
  }

  if (prefs.tips && saved.length === 0) {
    list.push({
      id: "tip-save-first",
      type: "tip",
      icon: "💡",
      title: "Save programs you like",
      desc: "Tap the bookmark on a program — we'll remind you before its application deadline.",
      date: startOfDay(now),
    });
  }

  // urgent deadlines first, then newest
  return list.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.date - a.date);
}
