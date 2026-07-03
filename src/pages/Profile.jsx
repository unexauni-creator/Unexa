import { useState } from "react";

const savedUniversities = [
  { id: 1, name: "Aix-Marseille Université", desc: "Marseille, France", image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg" },
  { id: 2, name: "Université Bordeaux-Montaigne", desc: "Bordeaux, France", image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg" },
  { id: 3, name: "Université Rennes 2", desc: "Rennes, France", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg" },
];

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

export default function Profile() {
  const [activeTab, setActiveTab] = useState("saved");

  return (
    <div className="profile-page">

      {/* Cover image */}
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
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-num">{savedUniversities.length}</span>
                <span className="profile-stat-label">Saved</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="profile-stat-num">{appliedUniversities.length}</span>
                <span className="profile-stat-label">Applied</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="profile-stat-num">3</span>
                <span className="profile-stat-label">Compared</span>
              </div>
            </div>
          </div>
        </div>
        <button className="profile-settings-btn">⚙️ Settings</button>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === "saved" ? "active" : ""}`} onClick={() => setActiveTab("saved")}>Saved Universities</button>
        <button className={`profile-tab ${activeTab === "applied" ? "active" : ""}`} onClick={() => setActiveTab("applied")}>Applied</button>
      </div>

      {/* Tab content */}
      <div className="profile-content">

        {activeTab === "saved" && (
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
                  <button className="uni-card-save">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
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