import { pool } from "../config/db.js";

const allowedRoles = ["admin", "petugas", "user"];

export async function getAdminUsers(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.default_anonymous,
        u.is_verified,
        u.is_suspended,
        u.created_at,
        COUNT(r.id) AS total_reports,
        SUM(r.is_emergency = 1) AS emergency_reports,
        MAX(r.created_at) AS last_report_at
      FROM users u
      LEFT JOIN reports r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY
        FIELD(u.role, 'admin', 'petugas', 'user'),
        u.created_at DESC`
    );

    res.json({ users: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data user.", error: error.message });
  }
}

export async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    const { role, isSuspended, isVerified } = req.body;
    const updates = [];
    const values = [];

    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Role tidak valid." });
      }
      updates.push("role = ?");
      values.push(role);
    }

    if (isSuspended !== undefined) {
      updates.push("is_suspended = ?");
      values.push(isSuspended === true || isSuspended === "true" ? 1 : 0);
    }

    if (isVerified !== undefined) {
      updates.push("is_verified = ?");
      values.push(isVerified === true || isVerified === "true" ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Tidak ada perubahan yang dikirim." });
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    res.json({ message: "Data user berhasil diperbarui." });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui user.", error: error.message });
  }
}
