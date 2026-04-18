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
  completeProfile = false,
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
      complete_profile: completeProfile,
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

export async function updateUserPasswordHash(userId, passwordHash) {
  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId)
    .select(
      "id,email,role,first_name,last_name,is_active,is_verified,complete_profile,updated_at",
    )
    .maybeSingle();

  return { data, error };
}

export async function getUsersForAdmin({ search, role, isActive }) {
  let query = supabase
    .from("users")
    .select(
      "id,email,role,first_name,last_name,is_active,is_verified,complete_profile,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (role) {
    query = query.eq("role", role);
  }

  if (typeof isActive === "boolean") {
    query = query.eq("is_active", isActive);
  }

  if (search && search.trim()) {
    const normalizedSearch = search.trim();
    query = query.or(
      `email.ilike.%${normalizedSearch}%,first_name.ilike.%${normalizedSearch}%,last_name.ilike.%${normalizedSearch}%`,
    );
  }

  const { data, error } = await query;
  return { data, error };
}

export async function changeActivationStatus(userId, isActive) {
  const { data, error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId)
    .select();

  return { isActive: data, isActiveError: error };
}

export async function changeVerificationStatus(userId, isVerified) {
  const { data, error } = await supabase
    .from("users")
    .update({ is_verified: isVerified })
    .eq("id", userId)
    .select();

  return { isVerified: data, isVerifiedError: error };
}
