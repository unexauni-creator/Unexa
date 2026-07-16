import { useState } from "react";

const GROUPS = [
  { id: 1, name: "Design Students France", desc: "Marseille, France", members: "1.2k members", image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg", joined: true },
  { id: 2, name: "Architecture Network", desc: "Bordeaux, France", members: "860 members", image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg", joined: false },
  { id: 3, name: "Fine Arts Collective", desc: "Besançon, France", members: "540 members", image: "https://cdn-s-www.bienpublic.com/images/AC513A2C-88A9-456D-972D-758F6975A8A9/NW_raw/le-campus-dijonnais-de-l-universite-de-bourgogne-accueille-plus-de-30-000-etudiants-photo-d-illustration-lbp-emma-buoncristiani-1690820597.jpg", joined: false },
  { id: 4, name: "Digital Media Makers", desc: "Loire, France", members: "2.1k members", image: "https://www.univ-st-etienne.fr/_richText-file/ametys-internal%253Asites/ujm/ametys-internal%253Acontents/plans-d-acces-2/_attribute/content/_data/Campus-Trefilerie-Pierre-Grasset.jpg", joined: true },
  { id: 5, name: "Fashion Design Hub", desc: "Nîmes, France", members: "410 members", image: "https://upload.wikimedia.org/wikipedia/commons/1/16/Scines_nimes.jpg", joined: false },
  { id: 6, name: "Rennes Art Society", desc: "Rennes, France", members: "760 members", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg", joined: false },
];

export default function Community() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("discover"); // discover | joined
  const [groups, setGroups] = useState(GROUPS);

  function toggleJoin(id) {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, joined: !g.joined } : g));
  }

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    if (q && !g.name.toLowerCase().includes(q) && !g.desc.toLowerCase().includes(q)) return false;
    if (activeTab === "joined") return g.joined;
    return true;
  });

  const joinedCount = groups.filter(g => g.joined).length;

  return (
    <div className="community-header">
      <h1 className="community-title">Community</h1>
      <p className="community-desc">Connect with students and groups across design and art universities.</p>

      <div className="community-search-row">
        <div className="home-search">
          <input
            type="text"
            placeholder="Search groups ......"
            className="home-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <img src="/search-normal.svg" alt="" className="home-search-icon-svg" />
        </div>
      </div>

      <div className="community-tabs">
        <button className={`community-tab ${activeTab === "discover" ? "active" : ""}`} onClick={() => setActiveTab("discover")}>
          Discover
        </button>
        <button className={`community-tab ${activeTab === "joined" ? "active" : ""}`} onClick={() => setActiveTab("joined")}>
          My Groups
          {joinedCount > 0 && <span className="community-tab-count">{joinedCount}</span>}
        </button>
      </div>

      <div className="community-content">
        {filtered.length > 0 ? (
          <div className="community-grid">
            {filtered.map(group => (
              <div key={group.id} className="community-card">
                <img src={group.image} alt={group.name} className="community-card-img" />
                <div className="community-card-glass">
                  <div className="community-card-glass-blur" />
                  <div className="community-card-text">
                    <div className="community-card-title">{group.name}</div>
                    <div className="community-card-subtitle">{group.desc}</div>
                    <div className="community-card-members">{group.members}</div>
                  </div>
                  <button
                    className={`community-card-join-btn ${group.joined ? "joined" : ""}`}
                    onClick={() => toggleJoin(group.id)}
                  >
                    {group.joined ? "Joined" : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="community-empty">
            <div className="community-empty-icon">👥</div>
            <div className="community-empty-title">
              {activeTab === "joined" ? "You haven't joined any groups yet" : "No groups found"}
            </div>
            <div className="community-empty-desc">
              {activeTab === "joined"
                ? "Switch to Discover and join a group to see it here."
                : "Try a different search term."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}