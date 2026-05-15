import { pool } from "../config/db.js";
import { randomUUID } from "node:crypto";
import { getCategoryByOrganizationType } from "../services/organizationService.js";
import { getPlatformConfig } from "../../lib/platform-config.js";

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

async function getAccessibleReport(reportId, user) {
  const [rows] = await pool.query(
    `SELECT id, user_id, assigned_to, organization_id
     FROM reports
     WHERE id = ?`,
    [reportId]
  );

  const report = rows[0];
  if (!report) return null;

  const isAdmin = user?.role === "admin" && report.organization_id === user.organizationId;
  const isOwner = user?.id && report.user_id === user.id;
  const isAssignee = user?.id && report.assigned_to === user.id;

  return isAdmin || isOwner || isAssignee ? report : false;
}

async function createNotification(connection, { userId, reportId = null, type, title, message }) {
  if (!userId) return;

  await connection.query(
    `INSERT INTO notifications (user_id, report_id, type, title, message)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, reportId, type, title, message]
  );
}

async function notifyAdmins(connection, { reportId, type, title, message }) {
  const [reports] = await connection.query("SELECT organization_id FROM reports WHERE id = ?", [reportId]);
  const organizationId = reports[0]?.organization_id;

  await connection.query(
    `INSERT INTO notifications (user_id, report_id, type, title, message)
     SELECT id, ?, ?, ?, ?
     FROM users
     WHERE role = 'admin'
       AND organization_id = ?`,
    [reportId, type, title, message, organizationId]
  );
}

async function createStatusLog(connection, { reportId, fromStatus = null, toStatus, changedBy = null, note = null }) {
  await connection.query(
    `INSERT INTO report_status_logs (report_id, from_status, to_status, changed_by, note)
     VALUES (?, ?, ?, ?, ?)`,
    [reportId, fromStatus, toStatus, changedBy, note]
  );
}

async function createInternalComment(connection, { reportId, userId = null, comment }) {
  const trimmedComment = comment?.trim();
  if (!trimmedComment) return;

  await connection.query(
    `INSERT INTO report_comments (report_id, user_id, comment, is_internal)
     VALUES (?, ?, ?, 1)`,
    [reportId, userId, trimmedComment]
  );
}

export async function createReport(req, res) {
  try {
    const {
      organizationId,
      category,
      title,
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
    const scopedOrganizationId = req.user?.organizationId || Number(organizationId || 0) || null;
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

    if (!scopedOrganizationId) {
      return res.status(400).json({ message: "Instansi tujuan laporan wajib dipilih." });
    }

    const [organizations] = await pool.query(
      "SELECT id, type, name FROM organizations WHERE id = ?",
      [scopedOrganizationId]
    );
    const organization = organizations[0];
    if (!organization) {
      return res.status(400).json({ message: "Instansi tujuan tidak ditemukan." });
    }

    if (req.user?.organizationId && Number(req.user.organizationId) !== Number(scopedOrganizationId)) {
      return res.status(403).json({ message: "Anda tidak dapat mengirim laporan ke instansi lain." });
    }

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
    const resolvedCategoryRecord = await getCategoryByOrganizationType(organization.type, resolvedCategory);
    const resolvedTitle = title?.trim() || location?.trim() || resolvedCategory;

    const connection = await pool.getConnection();
    let reportId;

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO reports
        (user_id, organization_id, category, category_id, title, edit_token, location, detail_location, description, photo_url, urgency, is_emergency, emergency_type, danger_level, needs_immediate_help, is_anonymous, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'terkirim')`,
        [
          userId,
          scopedOrganizationId,
          resolvedCategory,
          resolvedCategoryRecord?.id || null,
          resolvedTitle,
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

      reportId = result.insertId;

      await createStatusLog(connection, {
        reportId,
        toStatus: "terkirim",
        changedBy: userId,
        note: emergency ? "Laporan darurat berhasil dibuat." : "Laporan berhasil dibuat."
      });

      if (userId) {
        await createNotification(connection, {
          userId,
          reportId,
          type: "report_created",
          title: "Laporan berhasil dikirim",
          message: `Laporan Anda untuk ${organization.name} di lokasi ${location} sudah diterima sistem.`
        });
      }

      await notifyAdmins(connection, {
        reportId,
        type: emergency ? "emergency_alert" : "report_created",
        title: emergency ? "Laporan darurat baru" : "Laporan baru masuk",
        message: emergency
          ? `Ada laporan darurat baru di ${organization.name} - ${location}.`
          : `Ada laporan baru di ${organization.name} yang perlu ditinjau - ${location}.`
      });

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [rows] = await pool.query("SELECT * FROM reports WHERE id = ?", [reportId]);
    res.status(201).json({
      message: "Laporan berhasil dikirim.",
      report: rows[0],
      followup: emergency
        ? {
            reportId,
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
    const filters = ["user_id = ?", "organization_id = ?"];
    const values = [req.user.id, req.user.organizationId];

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
      `SELECT id, organization_id, category, category_id, title, location, detail_location, description, photo_url, urgency, is_emergency, emergency_type, danger_level, needs_immediate_help, is_anonymous, status, created_at
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
    const filters = ["r.organization_id = ?"];
    const values = [req.user.organizationId];

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
        r.organization_id,
        r.category,
        r.category_id,
        r.title,
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

export async function getReportActivity(req, res) {
  try {
    const reportId = Number(req.params.id);
    const accessibleReport = await getAccessibleReport(reportId, req.user);

    if (accessibleReport === null) {
      return res.status(404).json({ message: "Laporan tidak ditemukan." });
    }

    if (accessibleReport === false) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke laporan ini." });
    }

    const [statusLogs] = await pool.query(
      `SELECT
        l.id,
        l.report_id,
        l.from_status,
        l.to_status,
        l.note,
        l.created_at,
        u.id AS changed_by,
        COALESCE(u.name, 'Sistem') AS changed_by_name,
        u.role AS changed_by_role
       FROM report_status_logs l
       LEFT JOIN users u ON l.changed_by = u.id
       WHERE l.report_id = ?
       ORDER BY l.created_at DESC, l.id DESC`,
      [reportId]
    );

    const [comments] = await pool.query(
      `SELECT
        c.id,
        c.report_id,
        c.comment,
        c.is_internal,
        c.created_at,
        u.id AS user_id,
        COALESCE(u.name, 'Sistem') AS user_name,
        u.role AS user_role
       FROM report_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.report_id = ?
         AND (? = 'admin' OR c.is_internal = 0)
       ORDER BY c.created_at DESC, c.id DESC`,
      [reportId, req.user?.role || "user"]
    );

    res.json({ statusLogs, comments });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil aktivitas laporan.", error: error.message });
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

    const [[existingReport]] = await pool.query(
      `SELECT id, user_id, location, status, admin_note, assigned_to, organization_id
       FROM reports
       WHERE id = ?
         AND organization_id = ?`,
      [id, req.user.organizationId]
    );

    if (!existingReport) {
      return res.status(404).json({ message: "Laporan tidak ditemukan." });
    }

    let resolvedAssignee = existingReport.assigned_to;
    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        resolvedAssignee = null;
      } else {
        const [users] = await pool.query(
          "SELECT id FROM users WHERE id = ? AND organization_id = ?",
          [assignedTo, req.user.organizationId]
        );
        if (users.length === 0) {
          return res.status(400).json({ message: "Petugas yang dipilih tidak ditemukan." });
        }
        resolvedAssignee = Number(assignedTo);
      }
    }

    const nextAdminNote = typeof adminNote === "string" ? adminNote.trim() || null : existingReport.admin_note;
    const previousAdminNote = typeof existingReport.admin_note === "string" ? existingReport.admin_note.trim() : existingReport.admin_note;
    const statusChanged = existingReport.status !== status;
    const assigneeChanged = existingReport.assigned_to !== resolvedAssignee;
    const noteChanged = previousAdminNote !== nextAdminNote;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query("UPDATE reports SET status = ?, admin_note = ?, assigned_to = ? WHERE id = ? AND organization_id = ?", [
        status,
        nextAdminNote,
        resolvedAssignee,
        id,
        req.user.organizationId
      ]);

      if (statusChanged) {
        await createStatusLog(connection, {
          reportId: Number(id),
          fromStatus: existingReport.status,
          toStatus: status,
          changedBy: req.user?.id || null,
          note: nextAdminNote
        });
      }

      if (noteChanged && nextAdminNote) {
        await createInternalComment(connection, {
          reportId: Number(id),
          userId: req.user?.id || null,
          comment: nextAdminNote
        });
      }

      if (statusChanged && existingReport.user_id) {
        await createNotification(connection, {
          userId: existingReport.user_id,
          reportId: Number(id),
          type: "report_status_changed",
          title: "Status laporan diperbarui",
          message: `Laporan Anda di ${existingReport.location} sekarang berstatus ${status}.`
        });
      }

      if (assigneeChanged && resolvedAssignee) {
        await createNotification(connection, {
          userId: resolvedAssignee,
          reportId: Number(id),
          type: "report_assigned",
          title: "Laporan baru ditugaskan",
          message: `Anda ditugaskan menangani laporan di ${existingReport.location}.`
        });
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    res.json({ message: "Status laporan berhasil diperbarui." });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui status.", error: error.message });
  }
}

export async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM reports WHERE id = ? AND organization_id = ?", [id, req.user.organizationId]);
    res.json({ message: "Laporan berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus laporan.", error: error.message });
  }
}

export async function getAdminStats(req, res) {
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
      FROM reports
      WHERE organization_id = ?`,
      [req.user.organizationId]
    );

    const [[userStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total_user,
        SUM(role = 'admin') AS total_admin,
        SUM(role = 'petugas') AS total_petugas,
        SUM(role = 'user') AS total_user_biasa,
        SUM(is_suspended = 1) AS user_suspend,
        SUM(is_verified = 1) AS user_terverifikasi
      FROM users
      WHERE organization_id = ?`,
      [req.user.organizationId]
    );

    const [byCategory] = await pool.query(
      `SELECT category, COUNT(*) AS total
       FROM reports
       WHERE organization_id = ?
       GROUP BY category
       ORDER BY total DESC
       LIMIT 6`,
      [req.user.organizationId]
    );

    const [byLocation] = await pool.query(
      `SELECT location AS label, COUNT(*) AS total
       FROM reports
       WHERE organization_id = ?
       GROUP BY location
       ORDER BY total DESC
       LIMIT 5`,
      [req.user.organizationId]
    );

    const [byHour] = await pool.query(
      `SELECT LPAD(hour_slot, 2, '0') AS label, COUNT(*) AS total
       FROM (
         SELECT HOUR(created_at) AS hour_slot
         FROM reports
         WHERE organization_id = ?
       ) hourly_reports
       GROUP BY hour_slot
       ORDER BY hour_slot`,
      [req.user.organizationId]
    );

    const [weeklyTrend] = await pool.query(
      `SELECT DATE_FORMAT(report_day, '%d %b') AS label, COUNT(*) AS total
       FROM (
         SELECT DATE(created_at) AS report_day
         FROM reports
         WHERE organization_id = ?
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       ) daily_reports
       GROUP BY report_day
       ORDER BY report_day`,
      [req.user.organizationId]
    );

    const [monthlyTrend] = await pool.query(
      `SELECT DATE_FORMAT(MIN(created_at), '%b %Y') AS label, COUNT(*) AS total
       FROM reports
       WHERE organization_id = ?
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at)`,
      [req.user.organizationId]
    );

    const [statusBreakdown] = await pool.query(
      `SELECT status AS label, COUNT(*) AS total
       FROM reports
       WHERE organization_id = ?
       GROUP BY status`,
      [req.user.organizationId]
    );

    const [emergencyFeed] = await pool.query(
      `SELECT id, organization_id, location, detail_location, category, danger_level, emergency_type, needs_immediate_help, created_at, status
       FROM reports
       WHERE is_emergency = 1
         AND organization_id = ?
         AND status <> 'selesai'
       ORDER BY
         FIELD(danger_level, 'kritis', 'tinggi', 'sedang') DESC,
         created_at DESC
       LIMIT 5`,
      [req.user.organizationId]
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
