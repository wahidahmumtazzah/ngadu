import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { initializeDatabase, pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedAdmin() {
  const adminEmail = "admin@ngadu.local";
  const adminPassword = "admin123";
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [adminEmail]);

  if (rows.length > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    ["Admin NgaduAja", adminEmail, passwordHash]
  );
}

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server pengaduan aktif." });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: err.message || "Terjadi kesalahan server." });
});

initializeDatabase()
  .then(seedAdmin)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server berjalan di http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Gagal menyalakan backend:", error);
    process.exit(1);
  });
