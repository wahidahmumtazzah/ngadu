import { pool } from "../config/db.js";
import { getFirebaseAdminAuth } from "../config/firebaseAdmin.js";
import { syncAppUserSession } from "../services/authService.js";

export async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  req.authError = null;

  if (!authHeader?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    const appUser = await syncAppUserSession({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || "",
      emailVerified: Boolean(decodedToken.email_verified)
    });

    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: Boolean(decodedToken.email_verified),
      id: appUser?.id || null,
      name: appUser?.name || decodedToken.name || null,
      role: appUser?.role || null,
      roleLabel: appUser?.roleLabel || null,
      organizationId: appUser?.organizationId || null,
      isSuspended: Boolean(appUser?.isSuspended)
    };
  } catch (error) {
    req.user = null;
    req.authError = error instanceof Error ? error.message : "Sesi autentikasi tidak valid.";
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.authError) {
      return res.status(401).json({ message: `Autentikasi gagal: ${req.authError}` });
    }
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

  if (req.user?.isSuspended) {
    return res.status(403).json({ message: "Akun ini sedang dinonaktifkan oleh admin." });
  }

  if (!req.user?.emailVerified) {
    return res.status(403).json({ message: "Email akun belum diverifikasi di Firebase." });
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
