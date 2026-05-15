import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { getPlatformConfig, resolveRoleOption } from "../../lib/platform-config.js";
import {
  activateOrganizationByToken,
  buildOrganizationVerificationUrl,
  createOrganizationAbuseReport,
  createOrganizationVerificationToken,
  resendOrganizationVerification,
  sendOrganizationVerificationEmail
} from "../services/organizationService.js";

function normalizeLogo(file) {
  return file ? `/uploads/${file.filename}` : null;
}

function normalizeOrganizationName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function findPendingAdminForOrganization(connection, organizationId) {
  const [rows] = await connection.query(
    `SELECT id, email, role
     FROM users
     WHERE organization_id = ?
       AND role = 'admin'
     ORDER BY id ASC
     LIMIT 1`,
    [organizationId]
  );

  return rows[0] || null;
}

export async function listOrganizations(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, type, custom_type_label, logo_url, address, created_at
       FROM organizations
       WHERE status = 'active'
       ORDER BY name ASC`
    );

    res.json({ organizations: rows });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil daftar instansi.", error: error.message });
  }
}

export async function reportOrganizationAbuse(req, res) {
  try {
    const { id } = req.params;
    const { reason, reporterEmail } = req.body;

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: "Alasan pelaporan wajib diisi." });
    }

    const [organizations] = await pool.query(
      `SELECT id, name, status
       FROM organizations
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const organization = organizations[0];
    if (!organization) {
      return res.status(404).json({ message: "Instansi tidak ditemukan." });
    }

    const result = await createOrganizationAbuseReport({
      organizationId: organization.id,
      reporterUserId: req.user?.id || null,
      reporterEmail: reporterEmail?.trim() || null,
      reason: String(reason).trim(),
      sourceIp: req.ip || null
    });

    res.json({
      message: result.flagged
        ? "Laporan diterima. Instansi ini otomatis ditandai untuk peninjauan."
        : "Laporan diterima. Tim akan meninjau instansi tersebut.",
      moderation: result
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengirim laporan instansi.", error: error.message });
  }
}

export async function registerOrganization(req, res) {
  const connection = await pool.getConnection();

  try {
    const {
      organizationName,
      organizationType,
      customTypeLabel,
      address,
      adminName,
      adminEmail,
      adminPassword,
      phone
    } = req.body;

    if (!organizationName || !organizationType || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: "Data instansi dan admin wajib diisi lengkap." });
    }

    const config = getPlatformConfig(organizationType);
    const logoUrl = normalizeLogo(req.file);
    const verificationToken = createOrganizationVerificationToken();
    const verificationUrl = buildOrganizationVerificationUrl(verificationToken);
    const normalizedOrganizationName = normalizeOrganizationName(organizationName);
    const trimmedAdminEmail = adminEmail.trim();
    const trimmedOrganizationName = organizationName.trim();
    const trimmedAdminName = adminName.trim();
    const trimmedAddress = address?.trim() || null;
    const trimmedPhone = phone?.trim() || null;

    const [existingUsers] = await connection.query(
      `SELECT
        u.id,
        u.organization_id,
        u.role,
        o.status AS organization_status,
        o.email_verified_at
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.email = ?
       LIMIT 1`,
      [trimmedAdminEmail]
    );

    const existingUser = existingUsers[0];
    const canReusePendingRegistration =
      existingUser &&
      existingUser.role === "admin" &&
      existingUser.organization_id &&
      existingUser.organization_status === "pending_verification" &&
      !existingUser.email_verified_at;

    if (existingUser && !canReusePendingRegistration) {
      return res.status(400).json({ message: "Email admin sudah digunakan." });
    }

    const [existingOrganizations] = await connection.query(
      "SELECT id, contact_email, status, email_verified_at FROM organizations WHERE name_normalized = ? LIMIT 1",
      [normalizedOrganizationName]
    );
    const existingOrganization = existingOrganizations[0];
    const pendingOrganizationAdmin = existingOrganization?.id
      ? await findPendingAdminForOrganization(connection, existingOrganization.id)
      : null;
    const canReusePendingOrganization =
      existingOrganization &&
      existingOrganization.status === "pending_verification" &&
      !existingOrganization.email_verified_at &&
      (
        existingOrganization.contact_email === trimmedAdminEmail ||
        (!existingOrganization.contact_email && !pendingOrganizationAdmin)
      );

    if (existingOrganization && !canReusePendingOrganization) {
      return res.status(400).json({ message: "Nama instansi sudah terdaftar." });
    }

    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminRole = resolveRoleOption(organizationType, "admin");
    const customLabel = organizationType === "custom" ? customTypeLabel?.trim() || null : null;

    let organizationId;
    let userId;

    if (canReusePendingRegistration) {
      organizationId = existingUser.organization_id;

      await connection.query(
        `UPDATE organizations
         SET name = ?,
             name_normalized = ?,
             type = ?,
             custom_type_label = ?,
             logo_url = COALESCE(?, logo_url),
             address = ?,
             contact_email = ?,
             phone = ?,
             verification_token = ?,
             verification_sent_at = NOW(),
             review_note = NULL
         WHERE id = ?`,
        [
          trimmedOrganizationName,
          normalizedOrganizationName,
          organizationType,
          customLabel,
          logoUrl,
          trimmedAddress,
          trimmedAdminEmail,
          trimmedPhone,
          verificationToken,
          organizationId
        ]
      );

      await connection.query(
        `UPDATE users
         SET name = ?,
             password_hash = ?,
             role = 'admin',
             role_label = ?,
             is_suspended = 0
         WHERE id = ?`,
        [trimmedAdminName, passwordHash, adminRole.label, existingUser.id]
      );

      userId = existingUser.id;
    } else if (canReusePendingOrganization) {
      organizationId = existingOrganization.id;

      await connection.query(
        `UPDATE organizations
         SET name = ?,
             name_normalized = ?,
             type = ?,
             custom_type_label = ?,
             logo_url = COALESCE(?, logo_url),
             address = ?,
             contact_email = ?,
             phone = ?,
             verification_token = ?,
             verification_sent_at = NOW(),
             review_note = NULL
         WHERE id = ?`,
        [
          trimmedOrganizationName,
          normalizedOrganizationName,
          organizationType,
          customLabel,
          logoUrl,
          trimmedAddress,
          trimmedAdminEmail,
          trimmedPhone,
          verificationToken,
          organizationId
        ]
      );

      if (pendingOrganizationAdmin) {
        await connection.query(
          `UPDATE users
           SET name = ?,
               email = ?,
               password_hash = ?,
               role = 'admin',
               role_label = ?,
               is_suspended = 0
           WHERE id = ?`,
          [trimmedAdminName, trimmedAdminEmail, passwordHash, adminRole.label, pendingOrganizationAdmin.id]
        );
        userId = pendingOrganizationAdmin.id;
      } else {
        const [userResult] = await connection.query(
          `INSERT INTO users (organization_id, name, email, password_hash, role, role_label)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [organizationId, trimmedAdminName, trimmedAdminEmail, passwordHash, "admin", adminRole.label]
        );
        userId = userResult.insertId;
      }
    } else {
      const [organizationResult] = await connection.query(
        `INSERT INTO organizations (name, name_normalized, type, custom_type_label, logo_url, address, contact_email, phone, status, verification_token, verification_sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification', ?, NOW())`,
        [
          trimmedOrganizationName,
          normalizedOrganizationName,
          organizationType,
          customLabel,
          logoUrl,
          trimmedAddress,
          trimmedAdminEmail,
          trimmedPhone,
          verificationToken
        ]
      );

      organizationId = organizationResult.insertId;

      const [userResult] = await connection.query(
        `INSERT INTO users (organization_id, name, email, password_hash, role, role_label)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [organizationId, trimmedAdminName, trimmedAdminEmail, passwordHash, "admin", adminRole.label]
      );

      userId = userResult.insertId;
    }

    const delivery = await sendOrganizationVerificationEmail({
      email: trimmedAdminEmail,
      organizationName: trimmedOrganizationName,
      verificationUrl
    });

    if (process.env.NODE_ENV === "production" && !delivery.delivered) {
      throw new Error("Email verifikasi gagal dikirim. Pendaftaran dibatalkan.");
    }

    await connection.commit();

    if (process.env.NODE_ENV !== "production") {
      console.log(`[organization-verification] ${verificationUrl}`);
    }

    res.status(201).json({
      message: canReusePendingRegistration
        ? "Draft instansi pending diperbarui. Silakan verifikasi email terlebih dahulu sebelum login."
        : "Instansi berhasil dibuat. Silakan verifikasi email terlebih dahulu sebelum login.",
      organization: {
        id: organizationId,
        name: trimmedOrganizationName,
        type: organizationType,
        customTypeLabel: customLabel,
        logoUrl,
        address: trimmedAddress,
        phone: trimmedPhone,
        platformLabel: config.label,
        status: "pending_verification"
      },
      admin: {
        id: userId,
        name: trimmedAdminName,
        email: trimmedAdminEmail,
        role: "admin",
        roleLabel: adminRole.label
      },
      verification: {
        required: true,
        email: trimmedAdminEmail,
        deliveryMode: delivery.mode,
        verifyUrl: process.env.NODE_ENV === "production" ? null : verificationUrl
      }
      });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    const normalizedMessage =
      error?.code === "ER_DUP_ENTRY"
        ? "Data instansi bentrok dengan draft lama. Coba ubah nama instansi atau email admin."
        : error.message || "Gagal membuat instansi.";
    res.status(500).json({ message: normalizedMessage, error: error.message });
  } finally {
    connection.release();
  }
}

export async function verifyOrganizationEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Token verifikasi tidak ditemukan." });
    }

    const result = await activateOrganizationByToken(String(token));

    if (result.status === "not_found") {
      return res.status(404).json({ message: "Token verifikasi tidak valid atau sudah kedaluwarsa." });
    }

    if (result.status === "already_active") {
      return res.json({ message: "Instansi ini sudah aktif. Silakan login." });
    }

    res.json({ message: "Email berhasil diverifikasi. Workspace instansi sekarang aktif." });
  } catch (error) {
    res.status(500).json({ message: "Gagal memverifikasi email instansi.", error: error.message });
  }
}

export async function resendOrganizationVerificationEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email instansi wajib diisi." });
    }

    const result = await resendOrganizationVerification(String(email).trim());

    if (result.status === "not_found") {
      return res.status(404).json({ message: "Instansi dengan email tersebut tidak ditemukan." });
    }

    if (result.status === "already_active") {
      return res.json({ message: "Instansi ini sudah aktif. Silakan login." });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[organization-verification-resend] ${result.verificationUrl}`);
    }

    res.json({
      message: "Email verifikasi baru sudah dikirim.",
      verification: {
        email: email.trim(),
        deliveryMode: result.delivery.mode,
        verifyUrl: process.env.NODE_ENV === "production" ? null : result.verificationUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengirim ulang email verifikasi.", error: error.message });
  }
}
