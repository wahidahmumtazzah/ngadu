import { pool } from "../config/db.js";
import { randomUUID } from "node:crypto";

const emergencyCategoryMap = {
  perkelahian: "bullying",
  pengeroyokan: "bullying",
  ancaman: "bullying",
  pemalakan: "bullying",
  pelecehan: "bullying",
  intimidasi: "bullying",
  "kabel listrik terbuka": "fasilitas rusak",
  "plafon hampir jatuh": "fasilitas rusak",
  "lantai licin": "fasilitas rusak",
  "tangga rusak": "fasilitas rusak",
  "kaca pecah": "fasilitas rusak",
  "kebocoran besar": "fasilitas rusak",
  "bangunan retak": "fasilitas rusak",
  "orang mencurigakan": "keamanan",
  pencurian: "keamanan",
  vandalisme: "keamanan",
  tawuran: "keamanan",
  "akses gerbang rusak": "keamanan",
  "kebakaran kecil": "lingkungan",
  banjir: "lingkungan",
  "toilet meluap": "lingkungan",
  "mati listrik": "fasilitas rusak",
  "air mati total": "fasilitas rusak",
  "siswa/pengguna pingsan": "lingkungan",
  "lingkungan bau menyengat": "lingkungan",
  "sampah medis": "lingkungan",
  "hewan berbahaya": "lingkungan"
};

function normalizePhoto(file) {
  return file ? `/uploads/${file.filename}` : null;
}

export async function createReport(req, res) {
  try {
    const {
      category,
      location,
      detailLocation,
      description,
      urgency,
      isAnonymous,
      isEmergency,
      emergencyType,
      dangerLevel,
      needsImmediateHelp
    } = req.body;

    const userId = req.user?.id || null;
    const photoUrl = normalizePhoto(req.file);
    let anonymous = String(isAnonymous) === "true" || isAnonymous === true;
    const emergency = String(isEmergency) === "true" || isEmergency === true;
    const immediateHelp = String(needsImmediateHelp) === "true" || needsImmediateHelp === true;
    const resolvedCategory = emergency
      ? emergencyCategoryMap[String(emergencyType || "").trim().toLowerCase()] || "keamanan"
      : category;
    const resolvedUrgency = emergency ? urgency || "tinggi" : urgency;
    const resolvedDescription = emergency
      ? description?.trim() || "Laporan darurat tanpa detail tambahan."
      : description;
    const editToken = randomUUID().replace(/-/g, "");

    if (emergency) {
      if (!emergencyType || !location) {
        return res.status(400).json({ message: "Jenis darurat dan lokasi wajib diisi." });
      }
    } else if (!category || !location || !description || !urgency) {
      return res.status(400).json({ message: "Data laporan belum lengkap." });
    }

    if (isAnonymous === undefined && userId) {
      const [users] = await pool.query("SELECT default_anonymous FROM users WHERE id = ?", [userId]);
      anonymous = Boolean(users[0]?.default_anonymous);
    }

    const resolvedDangerLevel = emergency ? dangerLevel || "tinggi" : null;

    const [result] = await pool.query(
      `INSERT INTO reports
      (user_id, category, edit_token, location, detail_location, description, photo_url, urgency, is_emergency, emergency_type, danger_level, needs_immediate_help, is_anonymous, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'terkirim')`,
      [
        userId,
        resolvedCategory,
        editToken,
        location,
        detailLocation || null,
        resolvedDescription,
        photoUrl,
        resolvedUrgency,
        emergency ? 1 : 0,
        emergency ? emergencyType || null : null,
        resolvedDangerLevel,
        emergency ? (immediateHelp ? 1 : 0) : 0,
        anonymous ? 1 : 0
      ]
    );

    const [rows] = await pool.query("SELECT * FROM reports WHERE id = ?", [result.insertId]);
    res.status(201).json({
      message: "Laporan berhasil dikirim.",
      report: rows[0],
      followup: emergency
        ? {
            reportId: result.insertId,
            editToken
          }
        : null
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat laporan.", error: error.message });
  }
}

export async function addEmergencyFollowup(req, res) {
  try {
    const { id } = req.params;
    const { editToken, description, detailLocation } = req.body;

    if (!editToken) {
      return res.status(400).json({ message: "Token follow-up tidak ditemukan." });
    }

    const [reports] = await pool.query(
      "SELECT id, edit_token, description, detail_location, is_emergency FROM reports WHERE id = ?",
      [id]
    );

    const report = reports[0];
    if (!report || report.is_emergency !== 1 || report.edit_token !== editToken) {
      return res.status(403).json({ message: "Akses follow-up darurat tidak valid." });
    }

    const nextDescription = description?.trim()
      ? `${report.description}\n\nTambahan detail:\n${description.trim()}`
      : report.description;
    const nextDetailLocation = detailLocation?.trim() || report.detail_location || null;
    const nextPhoto = req.file ? normalizePhoto(req.file) : null;

    await pool.query(
      `UPDATE reports
       SET description = ?, detail_location = ?, photo_url = COALESCE(?, photo_url)
       WHERE id = ?`,
      [nextDescription, nextDetailLocation, nextPhoto, id]
    );

    res.json({ message: "Tambahan laporan darurat berhasil disimpan." });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan tambahan laporan darurat.", error: error.message });
  }
}

export async function getPublicStats(_req, res) {
  try {
    const [[summary]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'terkirim') AS terkirim,
        SUM(status = 'diproses') AS diproses,
        SUM(status = 'selesai') AS selesai
      FROM reports`
    );

    const [byCategory] = await pool.query(
      `SELECT category, COUNT(*) AS total
      FROM reports
      GROUP BY category
      ORDER BY total DESC`
    );

    res.json({ summary, byCategory });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil statistik.", error: error.message });
  }
}

export async function getMyReports(req, res) {
  try {
    const { category, status, emergency } = req.query;
    const filters = ["user_id = ?"];
    const values = [req.user.id];

    if (category) {
      filters.push("category = ?");
      values.push(category);
    }

    if (status) {
      filters.push("status = ?");
      values.push(status);
    }

    if (emergency === "1") {
      filters.push("is_emergency = 1");
    }

    const [rows] = await pool.query(
      `SELECT id, category, location, detail_location, description, photo_url, urgency, is_emergency, emergency_type, danger_level, needs_immediate_help, is_anonymous, status, created_at
       FROM reports
       WHERE ${filters.join(" AND ")}
       ORDER BY is_emergency DESC, created_at DESC`,
      values
    );

    res.json({ reports: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil laporan user.", error: error.message });
  }
}

export async function getAllReports(req, res) {
  try {
    const { category, status, emergency, urgency, location, search, assignedTo } = req.query;
    const filters = ["1 = 1"];
    const values = [];

    if (category) {
      filters.push("r.category = ?");
      values.push(category);
    }

    if (status) {
      filters.push("r.status = ?");
      values.push(status);
    }

    if (urgency) {
      filters.push("r.urgency = ?");
      values.push(urgency);
    }

    if (location) {
      filters.push("r.location LIKE ?");
      values.push(`%${location}%`);
    }

    if (search) {
      filters.push("(r.location LIKE ? OR r.description LIKE ? OR r.detail_location LIKE ? OR COALESCE(u.name, '') LIKE ?)");
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (assignedTo) {
      if (assignedTo === "unassigned") {
        filters.push("r.assigned_to IS NULL");
      } else {
        filters.push("r.assigned_to = ?");
        values.push(assignedTo);
      }
    }

    if (emergency === "1") {
      filters.push("r.is_emergency = 1");
    } else if (emergency === "0") {
      filters.push("r.is_emergency = 0");
    }

    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.category,
        r.location,
        r.detail_location,
        r.description,
        r.photo_url,
        r.urgency,
        r.is_emergency,
        r.emergency_type,
        r.danger_level,
        r.needs_immediate_help,
        r.is_anonymous,
        r.status,
        r.admin_note,
        r.assigned_to,
        r.created_at,
        r.updated_at,
        CASE
          WHEN r.is_anonymous = 1 THEN 'Anonim'
          ELSE COALESCE(u.name, 'Tamu')
        END AS reporter_name,
        assignee.name AS assignee_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users assignee ON r.assigned_to = assignee.id
      WHERE ${filters.join(" AND ")}
      ORDER BY
        r.is_emergency DESC,
        FIELD(r.danger_level, 'kritis', 'tinggi', 'sedang') DESC,
        r.needs_immediate_help DESC,
        r.created_at DESC`,
      values
    );

    res.json({ reports: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil semua laporan.", error: error.message });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNote, assignedTo } = req.body;
    const allowed = ["terkirim", "diproses", "selesai", "ditolak"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid." });
    }

    let resolvedAssignee = null;
    if (assignedTo !== undefined && assignedTo !== null && assignedTo !== "") {
      const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [assignedTo]);
      if (users.length === 0) {
        return res.status(400).json({ message: "Petugas yang dipilih tidak ditemukan." });
      }
      resolvedAssignee = Number(assignedTo);
    }

    await pool.query("UPDATE reports SET status = ?, admin_note = ?, assigned_to = ? WHERE id = ?", [
      status,
      adminNote?.trim() || null,
      resolvedAssignee,
      id
    ]);
    res.json({ message: "Status laporan berhasil diperbarui." });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui status.", error: error.message });
  }
}

export async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM reports WHERE id = ?", [id]);
    res.json({ message: "Laporan berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus laporan.", error: error.message });
  }
}

export async function getAdminStats(_req, res) {
  try {
    const [[summary]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(DATE(created_at) = CURDATE()) AS hari_ini,
        SUM(status = 'terkirim') AS terkirim,
        SUM(status = 'diproses') AS diproses,
        SUM(status = 'selesai') AS selesai,
        SUM(status = 'ditolak') AS ditolak,
        SUM(urgency = 'tinggi') AS urgensi_tinggi,
        SUM(is_emergency = 1) AS total_darurat,
        SUM(is_emergency = 1 AND status <> 'selesai') AS darurat_aktif,
        SUM(danger_level = 'kritis') AS darurat_kritis
      FROM reports`
    );

    const [[userStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total_user,
        SUM(role = 'admin') AS total_admin,
        SUM(role = 'petugas') AS total_petugas,
        SUM(role = 'user') AS total_user_biasa,
        SUM(is_suspended = 1) AS user_suspend,
        SUM(is_verified = 1) AS user_terverifikasi
      FROM users`
    );

    const [byCategory] = await pool.query(
      `SELECT category, COUNT(*) AS total
       FROM reports
       GROUP BY category
       ORDER BY total DESC
       LIMIT 6`
    );

    const [byLocation] = await pool.query(
      `SELECT location AS label, COUNT(*) AS total
       FROM reports
       GROUP BY location
       ORDER BY total DESC
       LIMIT 5`
    );

    const [byHour] = await pool.query(
      `SELECT LPAD(HOUR(created_at), 2, '0') AS label, COUNT(*) AS total
       FROM reports
       GROUP BY HOUR(created_at)
       ORDER BY HOUR(created_at)`
    );

    const [weeklyTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%d %b') AS label, COUNT(*) AS total
       FROM reports
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`
    );

    const [monthlyTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS label, COUNT(*) AS total
       FROM reports
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at)`
    );

    const [statusBreakdown] = await pool.query(
      `SELECT status AS label, COUNT(*) AS total
       FROM reports
       GROUP BY status`
    );

    const [emergencyFeed] = await pool.query(
      `SELECT id, location, detail_location, category, danger_level, emergency_type, needs_immediate_help, created_at, status
       FROM reports
       WHERE is_emergency = 1
         AND status <> 'selesai'
       ORDER BY
         FIELD(danger_level, 'kritis', 'tinggi', 'sedang') DESC,
         created_at DESC
       LIMIT 5`
    );

    const notifications = {
      laporanBaru: Number(summary.terkirim || 0),
      laporanDarurat: Number(summary.darurat_aktif || 0),
      belumDirespon: Number(summary.terkirim || 0),
      petugasAktif: Number(userStats.total_petugas || 0)
    };

    res.json({
      summary: {
        ...summary,
        total_user: Number(userStats.total_user || 0),
        total_admin: Number(userStats.total_admin || 0),
        total_petugas: Number(userStats.total_petugas || 0),
        total_user_biasa: Number(userStats.total_user_biasa || 0),
        user_suspend: Number(userStats.user_suspend || 0),
        user_terverifikasi: Number(userStats.user_terverifikasi || 0)
      },
      byCategory,
      byLocation,
      byHour,
      weeklyTrend,
      monthlyTrend,
      statusBreakdown,
      emergencyFeed,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil statistik admin.", error: error.message });
  }
}
