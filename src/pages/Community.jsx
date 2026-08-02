import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Community({ joinedGroupIds = [], onToggleJoin }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("discover"); // discover | joined

  useEffect(() => {
    let cancelled = false;

    async function fetchGroups() {
      setLoading(true);
      const { data, error } = await supabase
        .from("community_groups")
        .select("*");

      if (cancelled) return;

      if (error) {
        console.error("Помилка завантаження груп:", error);
        setLoadError(error.message);
      } else {
        setGroups(data);
        setLoadError(null);
      }
      setLoading(false);
    }

    fetchGroups();
    return () => { cancelled = true; };
  }, []);

  function isJoined(id) {
    return joinedGroupIds.includes(id);
  }

  function toggleJoin(id) {
    onToggleJoin?.(id);
  }

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    const desc = `${g.city ?? ""}, ${g.country ?? ""}`;
    if (q && !g.name.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) return false;
    if (activeTab === "joined") return isJoined(g.id);
    return true;
  });

  const joinedCount = groups.filter(g => isJoined(g.id)).length;

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
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "Nunito", color: "#8a7c70" }}>
            Loading groups...
          </div>
        )}

        {!loading && loadError && (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "Nunito", color: "#c05050" }}>
            Couldn't load groups: {loadError}
          </div>
        )}

        {!loading && !loadError && (
          filtered.length > 0 ? (
            <div className="community-grid">
              {filtered.map(group => (
                <div key={group.id} className="community-card">
                  <img src={group.image_url} alt={group.name} className="community-card-img" />
                  <div className="community-card-glass">
                    <div className="community-card-glass-blur" />
                    <div className="community-card-text">
                      <div className="community-card-title">{group.name}</div>
                      <div className="community-card-subtitle">{group.city}, {group.country}</div>
                      <div className="community-card-members">{group.member_count}</div>
                    </div>
                    <button
                      className={`community-card-join-btn ${isJoined(group.id) ? "joined" : ""}`}
                      onClick={() => toggleJoin(group.id)}
                    >
                      {isJoined(group.id) ? "Joined" : "Join"}
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
          )
        )}
      </div>
    </div>
  );
}