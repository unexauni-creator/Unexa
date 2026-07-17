import { useState } from "react";

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

export default function Profile({ savedUniversities, onToggleSave }) {
  const [activeTab, setActiveTab] = useState("saved");

  return (
    <div className="profile-page">

      {/* Cover image — contained, not stretched */}
      <div className="profile-cover">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80"
          alt="Cover"
          className="profile-cover-img"
        />
      </div>

      {/* Profile info */}
      <div className="profile-info-row">
        <div className="profile-left">
          <div className="profile-avatar-wrap">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
              alt="Avatar"
              className="profile-avatar"
            />
            <div className="profile-avatar-edit">📷</div>
          </div>
          <div className="profile-info">
            <div className="profile-name">Kateryna Dmytrenko</div>
            <div className="profile-bio">
              Passionate about art and design education. Exploring universities across Europe to find the perfect program. Currently focused on fine arts and digital media.
            </div>
          </div>
        </div>
        <button className="profile-settings-btn">
          <svg className="profile-settings-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
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
    </div>
  );
}