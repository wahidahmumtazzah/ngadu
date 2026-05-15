import { loginUser, registerUser } from "../services/authService.js";
import { pool } from "../config/db.js";

export async function register(req, res) {
  try {
    const { name, email, password, organizationId, roleLabel } = req.body;
    if (!name || !email || !password || !organizationId) {
      return res.status(400).json({ message: "Nama, email, password, dan instansi wajib diisi." });
    }

    const user = await registerUser({ name, email, password, organizationId, roleLabel });
    res.status(201).json({ message: "Registrasi berhasil.", user });
  } catch (error) {
    res.status(400).json({ message: error.message || "Registrasi gagal." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi." });
    }

    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message || "Login gagal." });
  }
}

export async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Belum login." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.organization_id,
        u.name,
        u.email,
        u.role,
        u.role_label,
        u.default_anonymous,
        u.is_verified,
        u.is_suspended,
        o.name AS organization_name,
        o.type AS organization_type,
        o.custom_type_label AS organization_custom_type_label,
        o.logo_url AS organization_logo_url,
        o.address AS organization_address
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLabel: user.role_label,
        organizationId: user.organization_id,
        organization: user.organization_id
          ? {
              id: user.organization_id,
              name: user.organization_name,
              type: user.organization_type,
              customTypeLabel: user.organization_custom_type_label,
              logoUrl: user.organization_logo_url,
              address: user.organization_address
            }
          : null,
        defaultAnonymous: Boolean(user.default_anonymous),
        isVerified: Boolean(user.is_verified),
        isSuspended: Boolean(user.is_suspended)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil profil user." });
  }
}

export async function updateMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Belum login." });
  }

  try {
    const { name, email, defaultAnonymous } = req.body;
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const normalized = defaultAnonymous === true || defaultAnonymous === "true" ? 1 : 0;

    if (!trimmedName || !trimmedEmail) {
      return res.status(400).json({ message: "Nama dan email wajib diisi." });
    }

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [trimmedEmail, req.user.id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email sudah digunakan akun lain." });
    }

    await pool.query(
      "UPDATE users SET name = ?, email = ?, default_anonymous = ? WHERE id = ?",
      [trimmedName, trimmedEmail, normalized, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.organization_id,
        u.name,
        u.email,
        u.role,
        u.role_label,
        u.default_anonymous,
        u.is_verified,
        u.is_suspended,
        o.name AS organization_name,
        o.type AS organization_type,
        o.custom_type_label AS organization_custom_type_label,
        o.logo_url AS organization_logo_url,
        o.address AS organization_address
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    const user = rows[0];
    res.json({
      message: "Profil berhasil diperbarui.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLabel: user.role_label,
        organizationId: user.organization_id,
        organization: user.organization_id
          ? {
              id: user.organization_id,
              name: user.organization_name,
              type: user.organization_type,
              customTypeLabel: user.organization_custom_type_label,
              logoUrl: user.organization_logo_url,
              address: user.organization_address
            }
          : null,
        defaultAnonymous: Boolean(user.default_anonymous),
        isVerified: Boolean(user.is_verified),
        isSuspended: Boolean(user.is_suspended)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui profil user." });
  }
}

export async function getMyNotifications(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Belum login." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        user_id,
        report_id,
        type,
        title,
        message,
        is_read,
        created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    );

    res.json({ notifications: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil notifikasi.", error: error.message });
  }
}

export async function markNotificationRead(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Belum login." });
  }

  try {
    const { id } = req.params;
    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ?
         AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notifikasi tidak ditemukan." });
    }

    res.json({ message: "Notifikasi ditandai sudah dibaca." });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui notifikasi.", error: error.message });
  }
}

export async function markAllNotificationsRead(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Belum login." });
  }

  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ?
         AND is_read = 0`,
      [req.user.id]
    );

    res.json({ message: "Semua notifikasi ditandai sudah dibaca." });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui semua notifikasi.", error: error.message });
  }
}
