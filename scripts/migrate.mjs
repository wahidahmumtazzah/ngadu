import { initializeDatabase } from "../server/config/db.js";

initializeDatabase()
  .then(() => {
    console.log("Database migrations completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database migrations failed:", error);
    process.exit(1);
  });
