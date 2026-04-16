import dotenv from "dotenv";
import app from "./src/app.js";
import supabase from "./src/config/supabase.js";
import InternalService from "./src/services/internal.service.js";

dotenv.config();

const PORT = process.env.PORT || 3003;

// Test Supabase connection on startup
supabase
  .schema("appointments")
  .from("appointments")
  .select("count")
  .then(({ error }) => {
    if (error) console.error("Supabase connection failed:", error.message);
    else console.log("Supabase connected");
  });

// Auto-cancel job — runs every 60 seconds
setInterval(async () => {
  try {
    const count = await InternalService.autoCancelExpiredAppointments();
    if (count > 0) {
      console.log(`Auto-cancel job: cancelled ${count} expired appointments`);
    }
  } catch (error) {
    console.error("Auto-cancel job failed:", error.message);
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Appointment service running on port ${PORT}`);
});