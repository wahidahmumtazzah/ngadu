import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { initializeDatabase, pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import { ensureDefaultOrganization, syncPlatformCategories } from "./services/organizationService.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedAdmin() {
  const adminEmail = "admin@ngadu.local";
  const adminPassword = "admin123";
  const [[defaultOrganization]] = await pool.query(
    "SELECT id, type FROM organizations ORDER BY id ASC LIMIT 1"
  );
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [adminEmail]);

  if (rows.length > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    `INSERT INTO users (organization_id, name, email, password_hash, role, role_label)
     VALUES (?, ?, ?, ?, 'admin', ?)`,
    [defaultOrganization?.id || null, "Admin NgaduAja", adminEmail, passwordHash, "Admin"]
  );
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || "owner@ngadu.local";
  const password = process.env.SUPER_ADMIN_PASSWORD || "owner123";
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);

  if (rows.length > 0) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (organization_id, name, email, password_hash, role, role_label, is_verified)
     VALUES (NULL, ?, ?, ?, 'super_admin', 'Super Admin', 1)`,
    ["Platform Owner", email, passwordHash]
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
app.use("/api/organizations", organizationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: err.message || "Terjadi kesalahan server." });
});

initializeDatabase()
  .then(syncPlatformCategories)
  .then(ensureDefaultOrganization)
  .then(seedAdmin)
  .then(seedSuperAdmin)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server berjalan di http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Gagal menyalakan backend:", error);
    process.exit(1);
  });
