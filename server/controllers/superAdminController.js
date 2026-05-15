import { pool } from "../config/db.js";

const allowedStatuses = ["pending_verification", "active", "flagged", "suspended"];

export async function getSuperAdminOverview(_req, res) {
  try {
    const [[summary]] = await pool.query(
      `SELECT
        COUNT(*) AS total_organizations,
        SUM(status = 'pending_verification') AS pending_organizations,
        SUM(status = 'active') AS active_organizations,
        SUM(status = 'flagged') AS flagged_organizations,
        SUM(status = 'suspended') AS suspended_organizations
       FROM organizations`
    );

    const [[userStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total_users,
        SUM(role = 'super_admin') AS total_super_admins,
        SUM(role = 'admin') AS total_org_admins
       FROM users`
    );

    const [[reportStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total_reports,
        SUM(is_emergency = 1) AS emergency_reports
       FROM reports`
    );

    const [[abuseStats]] = await pool.query(
      `SELECT COUNT(*) AS total_abuse_reports
       FROM organization_abuse_reports`
    );

    const [recentOrganizations] = await pool.query(
      `SELECT
        o.id,
        o.name,
        o.type,
        o.custom_type_label,
        o.status,
        o.contact_email,
        o.created_at,
        COUNT(DISTINCT abr.id) AS abuse_reports
       FROM organizations o
       LEFT JOIN organization_abuse_reports abr ON abr.organization_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 6`
    );

    res.json({
      summary: {
        ...summary,
        ...userStats,
        ...reportStats,
        ...abuseStats
      },
      recentOrganizations
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil ringkasan super admin.", error: error.message });
  }
}

export async function getSuperAdminOrganizations(req, res) {
  try {
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();
    const where = [];
    const values = [];

    if (status && allowedStatuses.includes(status)) {
      where.push("o.status = ?");
      values.push(status);
    }

    if (search) {
      where.push("(o.name LIKE ? OR o.contact_email LIKE ? OR o.address LIKE ?)");
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT
        o.id,
        o.name,
        o.type,
        o.custom_type_label,
        o.logo_url,
        o.address,
        o.contact_email,
        o.phone,
        o.status,
        o.email_verified_at,
        o.review_note,
        o.status_updated_at,
        o.created_at,
        reviewer.name AS status_updated_by_name,
        COUNT(DISTINCT u.id) AS total_users,
        COUNT(DISTINCT r.id) AS total_reports,
        COUNT(DISTINCT CASE WHEN r.is_emergency = 1 THEN r.id END) AS emergency_reports,
        COUNT(DISTINCT abr.id) AS abuse_reports,
        MAX(abr.created_at) AS last_abuse_at
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       LEFT JOIN reports r ON r.organization_id = o.id
       LEFT JOIN organization_abuse_reports abr ON abr.organization_id = o.id
       LEFT JOIN users reviewer ON reviewer.id = o.status_updated_by
       ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       GROUP BY o.id
       ORDER BY
         FIELD(o.status, 'flagged', 'pending_verification', 'suspended', 'active'),
         abuse_reports DESC,
         o.created_at DESC`,
      values
    );

    res.json({ organizations: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil daftar instansi.", error: error.message });
  }
}

export async function getSuperAdminOrganizationDetail(req, res) {
  try {
    const { id } = req.params;

    const [organizations] = await pool.query(
      `SELECT
        o.*,
        reviewer.name AS status_updated_by_name
       FROM organizations o
       LEFT JOIN users reviewer ON reviewer.id = o.status_updated_by
       WHERE o.id = ?
       LIMIT 1`,
      [id]
    );

    const organization = organizations[0];
    if (!organization) {
      return res.status(404).json({ message: "Instansi tidak ditemukan." });
    }

    const [abuseReports] = await pool.query(
      `SELECT
        abr.id,
        abr.reason,
        abr.reporter_email,
        abr.created_at,
        abr.source_ip,
        u.name AS reporter_name
       FROM organization_abuse_reports abr
       LEFT JOIN users u ON u.id = abr.reporter_user_id
       WHERE abr.organization_id = ?
       ORDER BY abr.created_at DESC
       LIMIT 10`,
      [id]
    );

    const [recentReports] = await pool.query(
      `SELECT
        id,
        title,
        category,
        location,
        status,
        is_emergency,
        created_at
       FROM reports
       WHERE organization_id = ?
       ORDER BY created_at DESC
       LIMIT 8`,
      [id]
    );

    const [[counts]] = await pool.query(
      `SELECT
        COUNT(DISTINCT u.id) AS total_users,
        COUNT(DISTINCT r.id) AS total_reports,
        COUNT(DISTINCT abr.id) AS total_abuse_reports
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       LEFT JOIN reports r ON r.organization_id = o.id
       LEFT JOIN organization_abuse_reports abr ON abr.organization_id = o.id
       WHERE o.id = ?`,
      [id]
    );

    res.json({
      organization: {
        ...organization,
        ...counts
      },
      abuseReports,
      recentReports
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil detail instansi.", error: error.message });
  }
}

export async function updateSuperAdminOrganizationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status instansi tidak valid." });
    }

    const [existingRows] = await pool.query(
      `SELECT id, status, email_verified_at
       FROM organizations
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ message: "Instansi tidak ditemukan." });
    }

    await pool.query(
      `UPDATE organizations
       SET status = ?,
           review_note = ?,
           status_updated_at = NOW(),
           status_updated_by = ?,
           email_verified_at = CASE
             WHEN ? = 'active' THEN COALESCE(email_verified_at, NOW())
             ELSE email_verified_at
           END
       WHERE id = ?`,
      [status, String(reviewNote || "").trim() || null, req.user.id, status, id]
    );

    res.json({
      message: existing.status === status ? "Catatan instansi berhasil diperbarui." : "Status instansi berhasil diperbarui."
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui status instansi.", error: error.message });
  }
}
