import { useState, useRef } from "react";

const appliedUniversities = [
  { id: 4, name: "Université de Nîmes", desc: "Nîmes, France", status: "In Review", image: "https://upload.wikimedia.org/wikipedia/commons/1/16/Scines_nimes.jpg" },
  { id: 5, name: "Université Jean-Monnet", desc: "Loire, France", status: "Submitted", image: "https://www.univ-st-etienne.fr/_richText-file/ametys-internal%253Asites/ujm/ametys-internal%253Acontents/plans-d-acces-2/_attribute/content/_data/Campus-Trefilerie-Pierre-Grasset.jpg" },
];

const STATUS_COLORS = {
  "In Review": { bg: "rgba(172,136,118,0.15)", color: "#AC8876" },
  "Submitted": { bg: "rgba(123,158,135,0.15)", color: "#7B9E87" },
  "Accepted": { bg: "rgba(123,158,135,0.25)", color: "#4a8c65" },
  "Rejected": { bg: "rgba(200,100,100,0.15)", color: "#c05050" },
};

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Edit profile" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "language", label: "Languages" },
];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="settings-toggle-knob" />
    </button>
  );
}

function SettingsPage({ onClose, avatarUrl, onAvatarChange, coverUrl, onCoverChange, name, setName, bio, setBio, onLogout }) {
  const [activeSection, setActiveSection] = useState("profile");
  const [email, setEmail] = useState("kateryna.dmytrenko@example.com");
  const [phone, setPhone] = useState("");
  const [notifNewUni, setNotifNewUni] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifTips, setNotifTips] = useState(false);
  const [language, setLanguage] = useState("English");
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAvatarChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleBannerSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCoverChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <button className="settings-back-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to profile
        </button>
      </div>

      <div className={`settings-banner ${!coverUrl ? "settings-banner-empty" : ""}`} onClick={() => bannerInputRef.current?.click()}>
        {coverUrl && <img src={coverUrl} alt="Cover" className="settings-banner-img" />}
        <div className="settings-banner-action">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {coverUrl ? "Change banner" : "Add banner"}
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleBannerSelect}
        />
      </div>

      <div className="settings-avatar-overlap-wrap" onClick={() => avatarInputRef.current?.click()}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="settings-avatar-overlap-img" />
        ) : (
          <div className="settings-avatar-overlap-placeholder">KD</div>
        )}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarSelect}
        />
      </div>

      <div className="settings-tabs-row">
        <div className="settings-tabs">
          {SETTINGS_SECTIONS.map(s => (
            <button
              key={s.id}
              className={`settings-tab ${activeSection === s.id ? "active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="settings-nav-logout" onClick={onLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>

      <div className="settings-scroll">
        <div className="settings-page-content">
          {activeSection === "profile" && (
            <>
              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Full name</div>
                </div>
                <input className="settings-input" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Email</div>
                </div>
                <input className="settings-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Bio</div>
                  <div className="settings-field-hint">A short line about you and what you're looking for</div>
                </div>
                <textarea className="settings-input settings-textarea" value={bio} onChange={e => setBio(e.target.value)} rows={4} />
              </div>

              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Phone number</div>
                  <div className="settings-field-hint">Optional</div>
                </div>
                <input className="settings-input" type="tel" placeholder="+33 6 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              <div className="settings-page-actions">
                <button className="filter-clear-btn" onClick={onClose}>Cancel</button>
                <button className="filter-save-btn" onClick={onClose}>Save</button>
              </div>
            </>
          )}

          {activeSection === "notifications" && (
            <>
              <div className="settings-field settings-field-row">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">New universities</div>
                  <div className="settings-field-hint">Get notified when a new university joins Unexa</div>
                </div>
                <ToggleSwitch checked={notifNewUni} onChange={setNotifNewUni} />
              </div>

              <div className="settings-field settings-field-row">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Application deadlines</div>
                  <div className="settings-field-hint">Reminders before saved programs close applications</div>
                </div>
                <ToggleSwitch checked={notifDeadlines} onChange={setNotifDeadlines} />
              </div>

              <div className="settings-field settings-field-row">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Tips & suggestions</div>
                  <div className="settings-field-hint">Occasional tips to improve your profile and matches</div>
                </div>
                <ToggleSwitch checked={notifTips} onChange={setNotifTips} />
              </div>

              <div className="settings-page-actions">
                <button className="filter-clear-btn" onClick={onClose}>Cancel</button>
                <button className="filter-save-btn" onClick={onClose}>Save</button>
              </div>
            </>
          )}

          {activeSection === "security" && (
            <>
              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Current password</div>
                </div>
                <input className="settings-input" type="password" placeholder="••••••••" />
              </div>

              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">New password</div>
                </div>
                <input className="settings-input" type="password" placeholder="••••••••" />
              </div>

              <div className="settings-field settings-field-row">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Two-factor authentication</div>
                  <div className="settings-field-hint">Add an extra layer of security to your account</div>
                </div>
                <ToggleSwitch checked={false} onChange={() => {}} />
              </div>

              <div className="settings-page-actions">
                <button className="filter-clear-btn" onClick={onClose}>Cancel</button>
                <button className="filter-save-btn" onClick={onClose}>Save</button>
              </div>
            </>
          )}

          {activeSection === "language" && (
            <>
              <div className="settings-field">
                <div className="settings-field-label-block">
                  <div className="settings-field-label">Display language</div>
                </div>
                <select className="settings-input" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Українська</option>
                  <option>Español</option>
                  <option>Français</option>
                </select>
              </div>

              <div className="settings-page-actions">
                <button className="filter-clear-btn" onClick={onClose}>Cancel</button>
                <button className="filter-save-btn" onClick={onClose}>Save</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}