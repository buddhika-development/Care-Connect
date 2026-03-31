import supabase from "../config/supabase.js";

export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  return { data, error };
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
}

export async function saveUser(
  email,
  passwordHash,
  role,
  firstName,
  lastName,
  isActive,
  isVerified,
) {
  console.log("Saving user with email:", email);
  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      role,
      first_name: firstName,
      last_name: lastName,
      is_active: isActive,
      is_verified: isVerified,
    })
    .select();

  console.log("User save result:", { data, error });
  return { data, error };
}

export async function updateUserProfile(userId, profileData) {
  const { data, error } = await supabase
    .from("users")
    .update(profileData)
    .eq("id", userId)
    .select();

  return { data, error };
}
