import supabase from "../config/supabase.js";

export async function deleteRefreshToken(userId) {
  const { data, error } = await supabase
    .from("refresh_tokens")
    .delete()
    .eq("user_id", userId);

  return { token: data, tokenError: error };
}

export async function saveRefreshToken(userId, refreshToken, expiredAt) {
  const { data, error } = await supabase
    .from("refresh_tokens")
    .insert({
      user_id: userId,
      token_hash: refreshToken,
      expires_at: expiredAt,
      is_revoked: false,
    })
    .select();

  return { savedToken: data, savedTokenError: error };
}

export async function findRefreshToken(userId) {
  const { data, error } = await supabase
    .from("refresh_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("is_revoked", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  return { token: data, tokenError: error };
}
