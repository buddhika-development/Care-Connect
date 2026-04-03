import { DatabaseError } from "../utils/errors.utils.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Supabase URL:", supabaseUrl ? "Loaded" : "Missing");
  console.log("Supabase Key:", supabaseKey ? "Loaded" : "Missing");

  if (!supabaseUrl || !supabaseKey) {
    throw new DatabaseError("Database credentials are missing!");
  }

  const dataBaseConnection = createClient(supabaseUrl, supabaseKey);
  return dataBaseConnection;
};

const supabase = supabaseClient();

export default supabase;
