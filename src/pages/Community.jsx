import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getInitials } from "../lib/initials.js";
import { addPost, deletePost, joinGroup, leaveGroup, loadGroups, loadMyGroupIds, loadPosts } from "../lib/communityStore.js";

const REFRESH_MS = 15000; // a group's feed refreshes itself while it is open

function timeAgo(iso) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const membersLabel = (n) => (n == null ? "" : `${n} ${n === 1 ? "member" : "members"}`);

function Avatar({ name, src, size = 36 }) {
  const [broken, setBroken] = useState(false);
  return src && !broken
    ? <img className="cm-avatar" src={src} alt="" style={{ width: size, height: size }} onError={() => setBroken(true)} />
    : <span className="cm-avatar cm-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }}>{getInitials(name)}</span>;
}

// A text box that grows with what you write; Cmd/Ctrl + Enter sends.
function Composer({ me, placeholder, onSend, autoFocus, compact }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setError(null);
    try { await onSend(body); setText(""); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return (
    <div className={`cm-composer ${compact ? "compact" : ""}`}>
      <Avatar name={me.name} src={me.avatar} size={compact ? 28 : 36} />
      <div className="cm-composer-box">
        <textarea
          value={text}
          autoFocus={autoFocus}
          placeholder={placeholder}
          rows={Math.min(8, Math.max(compact ? 1 : 2, text.split("\n").length))}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
          maxLength={4000}
        />
        <div className="cm-composer-foot">
          {error ? <span className="cm-error">{error}</span> : <span className="cm-hint">{compact ? "" : "⌘ + Enter to post"}</span>}
          <button className="cm-btn" onClick={send} disabled={!text.trim() || busy}>{busy ? "Posting…" : compact ? "Reply" : "Post"}</button>
        </div>
      </div>
    </div>
  );
}

function GroupPage({ group, me, joined, onJoin, onBack }) {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const refresh = useCallback(async () => {
    try { setPosts(await loadPosts(group.id)); setError(null); } catch (e) { setError(e.message); }
  }, [group.id]);

  useEffect(() => {
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const threads = useMemo(() => {
    const all = posts ?? [];
    return all.filter((p) => !p.parent_id).reverse().map((p) => ({ ...p, replies: all.filter((r) => r.parent_id === p.id) }));
  }, [posts]);

  async function send(body, parentId = null) {
    const created = await addPost({ groupId: group.id, parentId, author: me, body });
    setPosts((prev) => [...(prev ?? []), created]);
    if (parentId) setReplyTo(null);
  }
  async function remove(id) {
    if (!window.confirm("Delete this post?")) return;
    try { await deletePost(id); setPosts((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id)); } catch (e) { alert(e.message); }
  }

  function renderPost(p, isReply) {
    return (
      <div key={p.id} className={`cm-post ${isReply ? "is-reply" : ""}`}>
        <Avatar name={p.author_name} src={p.author_avatar} size={isReply ? 28 : 36} />
        <div className="cm-post-main">
          <div className="cm-post-head">
            <span className="cm-post-name">{p.author_name || "Student"}</span>
            {p.user_id === me.id && <span className="cm-you">you</span>}
            <span className="cm-post-time">{timeAgo(p.created_at)}</span>
          </div>
          <div className="cm-post-body">{p.body}</div>
          <div className="cm-post-actions">
            {!isReply && joined && <button onClick={() => setReplyTo(replyTo === p.id ? null : p.id)}>💬 Reply{p.replies?.length ? ` · ${p.replies.length}` : ""}</button>}
            {!isReply && !joined && p.replies?.length > 0 && <span>💬 {p.replies.length}</span>}
            {p.user_id === me.id && <button className="danger" onClick={() => remove(p.id)}>Delete</button>}
          </div>
          {!isReply && (
            <>
              {p.replies?.map((r) => renderPost(r, true))}
              {replyTo === p.id && <Composer me={me} compact autoFocus placeholder={`Reply to ${p.author_name || "this post"}…`} onSend={(b) => send(b, p.id)} />}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cm-group">
      <button className="cm-back" onClick={onBack}>← All groups</button>
      <div className="cm-group-head">
        {group.image_url && <img src={group.image_url} alt="" className="cm-group-img" />}
        <div className="cm-group-info">
          <h2 className="cm-group-name">{group.name}</h2>
          <div className="cm-group-sub">{[group.city, group.country].filter(Boolean).join(", ")}{group.members != null && ` · ${membersLabel(group.members)}`}</div>
        </div>
        <button className={`cm-join ${joined ? "joined" : ""}`} onClick={() => onJoin(group.id)}>{joined ? "Joined ✓" : "Join group"}</button>
      </div>

      {joined
        ? <Composer me={me} placeholder={`Share something with ${group.name}: a question, a tip, your work…`} onSend={(b) => send(b)} />
        : <div className="cm-join-note">👋 Join this group to post and reply. Anyone signed in can read it.</div>}

      {error && <div className="cm-error-box">Couldn't load posts: {error}</div>}
      {posts === null && !error && <div className="cm-muted-center">Loading posts…</div>}
      {posts && threads.length === 0 && (
        <div className="community-empty">
          <div className="community-empty-icon">✍️</div>
          <div className="community-empty-title">No posts yet</div>
          <div className="community-empty-desc">{joined ? "Start the conversation: say hi, ask a question or share your portfolio." : "Join the group and be the first to post."}</div>
        </div>
      )}
      <div className="cm-feed">{threads.map((p) => renderPost(p, false))}</div>
    </div>
  );
}

export default function Community({ currentUser, avatarUrl, legacyJoinedIds = [], onLegacyMigrated }) {
  const me = useMemo(() => ({ id: currentUser?.id, name: currentUser?.name || "Student", avatar: avatarUrl || null }), [currentUser, avatarUrl]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("discover"); // discover | joined
  const [openId, setOpenId] = useState(null);
  const migrated = useRef(false);
  const [accountReady, setAccountReady] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // before agent/sql/007_community.sql is run the members table is missing: groups still show
        let ready = true;
        const [g, mine] = await Promise.all([
          loadGroups(),
          me.id ? loadMyGroupIds(me.id).catch(() => { ready = false; return [...legacyJoinedIds]; }) : [],
        ]);
        if (cancelled) return;
        setAccountReady(ready);
        // groups joined before Join was saved in the account move there once
        const toMove = legacyJoinedIds.filter((id) => !mine.includes(id) && g.some((x) => x.id === id));
        if (ready && me.id && toMove.length && !migrated.current) {
          migrated.current = true;
          await Promise.all(toMove.map((id) => joinGroup(me.id, id).catch(() => {})));
          mine.push(...toMove);
        }
        if (ready && me.id) onLegacyMigrated?.();
        setGroups(g); setJoinedIds(mine); setLoadError(null);
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id]);

  const isJoined = (id) => joinedIds.includes(id);

  async function toggleJoin(id) {
    if (!me.id) return;
    if (!accountReady) { alert("Groups are being set up. Please try again in a few minutes."); return; }
    const was = isJoined(id);
    setJoinedIds((prev) => (was ? prev.filter((x) => x !== id) : [...prev, id]));
    setGroups((prev) => prev.map((g) => (g.id === id && g.members != null ? { ...g, members: g.members + (was ? -1 : 1) } : g)));
    try {
      await (was ? leaveGroup(me.id, id) : joinGroup(me.id, id));
    } catch (e) {
      // put it back the way it is in the account
      setJoinedIds((prev) => (was ? [...prev, id] : prev.filter((x) => x !== id)));
      setGroups((prev) => prev.map((g) => (g.id === id && g.members != null ? { ...g, members: g.members + (was ? 1 : -1) } : g)));
      alert(`Couldn't ${was ? "leave" : "join"} the group: ${e.message}`);
    }
  }

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    const desc = `${g.city ?? ""}, ${g.country ?? ""}`;
    if (q && !g.name.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) return false;
    if (activeTab === "joined") return isJoined(g.id);
    return true;
  });
  const joinedCount = groups.filter((g) => isJoined(g.id)).length;
  const openGroup = groups.find((g) => g.id === openId);

  return (
    <div className="community-header">
      <h1 className="community-title">Community</h1>
      <p className="community-desc">Connect with students and groups across design and art universities.</p>

      {!openGroup && (
        <div className="community-search-row">
          <div className="home-search">
            <input type="text" placeholder="Search groups…" className="home-search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            <img src="/search-normal.svg" alt="" className="home-search-icon-svg" />
          </div>
        </div>
      )}

      <div className="community-tabs">
        <button className={`community-tab ${activeTab === "discover" ? "active" : ""}`} onClick={() => { setActiveTab("discover"); setOpenId(null); }}>Discover</button>
        <button className={`community-tab ${activeTab === "joined" ? "active" : ""}`} onClick={() => { setActiveTab("joined"); setOpenId(null); }}>
          My Groups
          {joinedCount > 0 && <span className="community-tab-count">{joinedCount}</span>}
        </button>
      </div>

      <div className="community-content">
        <div className="community-scroll">
        {loading && <div className="cm-muted-center">Loading groups…</div>}
        {!loading && loadError && <div className="cm-error-box">Couldn't load groups: {loadError}</div>}

        {!loading && !loadError && openGroup && (
          <GroupPage group={openGroup} me={me} joined={isJoined(openGroup.id)} onJoin={toggleJoin} onBack={() => setOpenId(null)} />
        )}

        {!loading && !loadError && !openGroup && (
          filtered.length > 0 ? (
            <div className="community-grid">
              {filtered.map((group) => (
                <div key={group.id} className="community-card" onClick={() => setOpenId(group.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(group.id); }}>
                  <img src={group.image_url} alt={group.name} className="community-card-img" />
                  <div className="community-card-glass">
                    {group.image_url && <img src={group.image_url} alt="" aria-hidden="true" className="card-glass-photo" />}
                    <div className="community-card-glass-blur" />
                    <div className="community-card-text">
                      <div className="community-card-title">{group.name}</div>
                      <div className="community-card-subtitle">{[group.city, group.country].filter(Boolean).join(", ")}</div>
                      <div className="community-card-members">
                        {group.members != null ? membersLabel(group.members) : group.member_count}
                        {group.posts > 0 && ` · ${group.posts} ${group.posts === 1 ? "post" : "posts"}`}
                      </div>
                    </div>
                    <button className={`community-card-join-btn ${isJoined(group.id) ? "joined" : ""}`} onClick={(e) => { e.stopPropagation(); toggleJoin(group.id); }}>
                      {isJoined(group.id) ? "Joined" : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="community-empty">
              <div className="community-empty-icon">👥</div>
              <div className="community-empty-title">{activeTab === "joined" ? "You haven't joined any groups yet" : "No groups found"}</div>
              <div className="community-empty-desc">{activeTab === "joined" ? "Switch to Discover and join a group to see it here." : "Try a different search term."}</div>
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
}
