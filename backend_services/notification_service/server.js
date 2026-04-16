import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
