// Community groups: who joined (group_members), group posts and replies (group_posts).
// Tables and access rules: agent/sql/007_community.sql.
import { supabase } from "./supabaseClient";

export async function loadGroups() {
  const { data, error } = await supabase.from("community_groups").select("*").order("name");
  if (error) throw new Error(error.message);
  // real counts; before 007 has been run the view is missing, so groups still load
  const { data: stats } = await supabase.from("community_group_stats").select("group_id, members, posts");
  const byId = new Map((stats ?? []).map((s) => [s.group_id, s]));
  return data.map((g) => ({ ...g, members: byId.get(g.id)?.members ?? null, posts: byId.get(g.id)?.posts ?? 0 }));
}

export async function loadMyGroupIds(userId) {
  const { data, error } = await supabase.from("group_members").select("group_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data.map((r) => r.group_id);
}

export async function joinGroup(userId, groupId) {
  const { error } = await supabase.from("group_members").upsert({ group_id: groupId, user_id: userId }, { onConflict: "group_id,user_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function leaveGroup(userId, groupId) {
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function loadPosts(groupId) {
  const { data, error } = await supabase
    .from("group_posts")
    .select("id, parent_id, user_id, author_name, author_avatar, body, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return data;
}

export async function addPost({ groupId, parentId = null, author, body }) {
  const { data, error } = await supabase
    .from("group_posts")
    .insert({ group_id: groupId, parent_id: parentId, author_name: author.name, author_avatar: author.avatar, body })
    .select("id, parent_id, user_id, author_name, author_avatar, body, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("group_posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
}
