import dotenv from "dotenv";
import app from "./src/app.js";
import supabase from "./src/config/supabase.js";

dotenv.config();

const PORT = process.env.PORT || 3006;

// Test Supabase connection on startup
supabase
  .schema("telemedicine")
  .from("sessions")
  .select("count")
  .then(({ error }) => {
    if (error) console.error("Supabase connection failed:", error.message);
    else console.log("Supabase connected");
  });

app.listen(PORT, () => {
  console.log(`Telemedicine service running on port ${PORT}`);
});
