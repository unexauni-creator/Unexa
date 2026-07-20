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
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security & Access" },
  { id: "language", label: "Language & Region" },
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

function SettingsPanel({ onClose, avatarUrl, onAvatarChange, coverUrl, onCoverChange, name, setName, bio, setBio }) {
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
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="filter-title">Settings</span>
          <button className="filter-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Banner */}
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

        <div className="settings-body">
          <div className="settings-nav">
            {SETTINGS_SECTIONS.map(s => (
              <button
                key={s.id}
                className={`settings-nav-item ${activeSection === s.id ? "active" : ""}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="settings-content">
            {activeSection === "profile" && (
              <>
                <div className="settings-section-title">Profile</div>
                <p className="settings-section-desc">This is how others will see you across Unexa.</p>

                <div className="settings-field settings-field-picture">
                  <div className="settings-field-label-block">
                    <div className="settings-field-label">Profile picture</div>
                    <div className="settings-field-hint">Set or change your profile picture</div>
                  </div>
                  <div className="settings-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="settings-avatar-img" />
                    ) : (
                      <div className="settings-avatar-placeholder">KD</div>
                    )}
                    <div className="settings-avatar-overlay">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleAvatarSelect}
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <div className="settings-field-label-block">
                    <div className="settings-field-label">Full name</div>
                  </div>
                  <input className="settings-input" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="settings-field">
                  <div className="settings-field-label-block">
                    <div className="settings-field-label">Bio</div>
                    <div className="settings-field-hint">A short line about you and what you're looking for</div>
                  </div>
                  <textarea className="settings-input settings-textarea" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                </div>

                <div className="settings-field">
                  <div className="settings-field-label-block">
                    <div className="settings-field-label">Email</div>
                  </div>
                  <input className="settings-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="settings-field">
                  <div className="settings-field-label-block">
                    <div className="settings-field-label">Phone number</div>
                    <div className="settings-field-hint">Optional</div>
                  </div>
                  <input className="settings-input" type="tel" placeholder="+33 6 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <>
                <div className="settings-section-title">Notifications</div>
                <p className="settings-section-desc">Choose what you want to hear about.</p>

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
              </>
            )}

            {activeSection === "security" && (
              <>
                <div className="settings-section-title">Security & Access</div>
                <p className="settings-section-desc">Manage your password and account access.</p>

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
              </>
            )}

            {activeSection === "language" && (
              <>
                <div className="settings-section-title">Language & Region</div>
                <p className="settings-section-desc">Choose the language you'd like Unexa displayed in.</p>

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
              </>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="filter-clear-btn" onClick={onClose}>Cancel</button>
          <button className="filter-save-btn" onClick={onClose}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default function Profile({ savedUniversities, onToggleSave, avatarUrl, coverUrl, onAvatarChange, onCoverChange }) {
  const [activeTab, setActiveTab] = useState("saved");
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState("Kateryna Dmytrenko");
  const [bio, setBio] = useState(
    "Passionate about art and design education. Exploring universities across Europe to find the perfect program. Currently focused on fine arts and digital media."
  );
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  function handleFileSelect(e, onChange) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="profile-page">

      {/* Cover */}
      <div className={`profile-cover ${!coverUrl ? "profile-cover-empty" : ""}`}>
        {coverUrl && <img src={coverUrl} alt="Cover" className="profile-cover-img" />}

        <div className="profile-cover-actions">
          <button className="profile-photo-action-btn" onClick={() => coverInputRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {coverUrl ? "Change cover" : "Add cover photo"}
          </button>
          {coverUrl && (
            <button className="profile-photo-action-btn profile-photo-action-remove" onClick={() => onCoverChange(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remove
            </button>
          )}
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => handleFileSelect(e, onCoverChange)}
        />
      </div>

      {/* Profile info */}
      <div className="profile-info-row">
        <div className="profile-left">
          <div className="profile-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">KD</div>
            )}

            <div className="profile-avatar-actions">
              <button
                className="profile-avatar-action-btn"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Change photo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              {avatarUrl && (
                <button
                  className="profile-avatar-action-btn profile-avatar-action-remove"
                  onClick={() => onAvatarChange(null)}
                  aria-label="Remove photo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => handleFileSelect(e, onAvatarChange)}
            />
          </div>
          <div className="profile-info">
            <div className="profile-name">{name}</div>
            <div className="profile-bio">{bio}</div>
          </div>
        </div>
        <button className="profile-settings-btn" onClick={() => setShowSettings(true)}>
          Settings
          <svg className="profile-settings-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === "saved" ? "active" : ""}`} onClick={() => setActiveTab("saved")}>
          Saved Universities
          {savedUniversities.length > 0 && <span className="community-tab-count">{savedUniversities.length}</span>}
        </button>
        <button className={`profile-tab ${activeTab === "applied" ? "active" : ""}`} onClick={() => setActiveTab("applied")}>Applied</button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === "saved" && (
          savedUniversities.length > 0 ? (
            <div className="uni-grid">
              {savedUniversities.map(uni => (
                <div key={uni.id} className="uni-card-new">
                  <img src={uni.image} alt={uni.name} className="uni-card-img" />
                  <div className="uni-card-glass">
                    <div className="uni-card-glass-blur" />
                    <div className="uni-card-text">
                      <div className="uni-card-title">{uni.name}</div>
                      <div className="uni-card-subtitle">{uni.desc}</div>
                    </div>
                    <button
                      className="uni-card-save saved"
                      onClick={e => { e.stopPropagation(); onToggleSave(uni); }}
                      aria-label="Remove from profile"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="compare-empty">
              <div className="compare-empty-icon">🔖</div>
              <div className="compare-empty-title">No saved universities yet</div>
              <div className="compare-empty-desc">Go to Home and tap the bookmark icon on any university card to save it here.</div>
            </div>
          )
        )}

        {activeTab === "applied" && (
          <div className="profile-applied-list">
            {appliedUniversities.map(uni => (
              <div key={uni.id} className="profile-applied-card">
                <img src={uni.image} alt={uni.name} className="profile-applied-img" />
                <div className="profile-applied-info">
                  <div className="profile-applied-name">{uni.name}</div>
                  <div className="profile-applied-desc">{uni.desc}</div>
                </div>
                <div
                  className="profile-applied-status"
                  style={{ background: STATUS_COLORS[uni.status]?.bg, color: STATUS_COLORS[uni.status]?.color }}
                >
                  {uni.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          avatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
          coverUrl={coverUrl}
          onCoverChange={onCoverChange}
          name={name}
          setName={setName}
          bio={bio}
          setBio={setBio}
        />
      )}
    </div>
  );
}