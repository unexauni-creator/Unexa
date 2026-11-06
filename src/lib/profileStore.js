// Profile name, bio and photos live in the account: table `profiles`, storage bucket `profile-photos`
// (see agent/sql/005_profile_photos.sql). Every user can only change files in their own folder.
import { supabase } from "./supabaseClient";

const BUCKET = "profile-photos";
const MAX_SIDE = { avatar: 512, cover: 1800 };
const COLUMN = { avatar: "avatar_url", cover: "cover_url" };

// Shrinks a picked photo to a sensible size before uploading it.
function toJpeg(dataUrl, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // transparent PNGs become white, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't read this image"))), "image/jpeg", 0.85);
    };
    img.onerror = () => reject(new Error("Couldn't read this image"));
    img.src = dataUrl;
  });
}

const pathFromUrl = (url) => url?.split(`/${BUCKET}/`)[1]?.split("?")[0] ?? null;

async function removeFile(url) {
  const path = pathFromUrl(url);
  // a leftover file is harmless, so a failed clean-up doesn't fail the whole action
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}

export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url, cover_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveProfileText(userId, { name, bio }) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, full_name: name, bio });
  if (error) throw new Error(error.message);
}

/**
 * @param {"avatar"|"cover"} kind
 * @param {string} dataUrl the picked photo
 * @param {string|null} previousUrl the photo it replaces
 * @returns {Promise<string>} public URL of the uploaded photo
 */
export async function saveProfilePhoto(userId, kind, dataUrl, previousUrl) {
  const blob = await toJpeg(dataUrl, MAX_SIDE[kind]);
  const path = `${userId}/${kind}-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (uploadError) throw new Error(uploadError.message);

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("profiles").upsert({ id: userId, [COLUMN[kind]]: url });
  if (error) {
    await removeFile(url);
    throw new Error(error.message);
  }
  await removeFile(previousUrl);
  return url;
}

export async function removeProfilePhoto(userId, kind, previousUrl) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, [COLUMN[kind]]: null });
  if (error) throw new Error(error.message);
  await removeFile(previousUrl);
}
