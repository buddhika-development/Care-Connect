import bcrypt from "bcryptjs";

export async function hashPassword(password) {
  const saltRound = Number(process.env.SALT_ROUNDS || 10);
  return bcrypt.hash(password, saltRound);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
