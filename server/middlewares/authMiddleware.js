import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Akses ditolak. Silakan login." });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Hanya admin yang dapat mengakses." });
  }
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Hanya super admin yang dapat mengakses." });
  }
  next();
}

export async function requireActiveOrganization(req, res, next) {
  if (req.user?.role === "super_admin") {
    return next();
  }

  if (!req.user?.organizationId) {
    return res.status(403).json({ message: "Akun ini belum terhubung ke instansi aktif." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, status, email_verified_at
       FROM organizations
       WHERE id = ?`,
      [req.user.organizationId]
    );

    const organization = rows[0];
    if (!organization) {
      return res.status(403).json({ message: "Instansi akun ini tidak ditemukan." });
    }

    if (organization.status === "suspended") {
      return res.status(403).json({ message: "Instansi ini sedang disuspend." });
    }

    if (organization.status === "flagged") {
      return res.status(403).json({ message: "Instansi ini sedang ditinjau karena aktivitas mencurigakan." });
    }

    if (organization.status !== "active" || !organization.email_verified_at) {
      return res.status(403).json({ message: "Instansi belum aktif. Silakan selesaikan verifikasi email terlebih dahulu." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Gagal memverifikasi status instansi.", error: error.message });
  }
}
