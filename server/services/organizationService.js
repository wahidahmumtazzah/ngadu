import { pool } from "../config/db.js";
import { getPlatformConfig, getRoleLabel, organizationTypeOptions } from "../../lib/platform-config.js";
import { randomUUID } from "node:crypto";
import { sendEmail } from "./emailService.js";

export async function syncPlatformCategories() {
  for (const option of organizationTypeOptions) {
    const config = getPlatformConfig(option.value);
    const categories = config.categories || [];

    for (let index = 0; index < categories.length; index += 1) {
      const category = categories[index];
      await pool.query(
        `INSERT INTO categories (organization_type, name, icon, description, sort_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           icon = VALUES(icon),
           description = VALUES(description),
           sort_order = VALUES(sort_order)`,
        [option.value, category.name, category.icon || null, category.description || null, index + 1]
      );
    }
  }
}

export async function ensureDefaultOrganization() {
  const [[existingOrg]] = await pool.query(
    "SELECT id, name, type FROM organizations ORDER BY id ASC LIMIT 1"
  );

  let organizationId = existingOrg?.id || null;
  let organizationType = existingOrg?.type || "custom";

  if (!organizationId) {
    const [result] = await pool.query(
      `INSERT INTO organizations (name, name_normalized, type, address, contact_email, status, email_verified_at)
       VALUES (?, ?, 'custom', ?, ?, 'active', NOW())`,
      ["NgaduAja Workspace", "ngaduaja workspace", "Workspace default hasil bootstrap sistem", "admin@ngadu.local"]
    );
    organizationId = result.insertId;
    organizationType = "custom";
  }

  await pool.query(
    `UPDATE users
     SET organization_id = COALESCE(organization_id, ?)
     WHERE organization_id IS NULL`,
    [organizationId]
  );

  await pool.query(
    `UPDATE reports
     SET organization_id = COALESCE(organization_id, ?)
     WHERE organization_id IS NULL`,
    [organizationId]
  );

  await pool.query(
    `UPDATE users
     SET role_label = CASE
       WHEN role = 'admin' THEN ?
       WHEN role = 'petugas' THEN ?
       ELSE ?
     END
     WHERE organization_id = ?
       AND (role_label IS NULL OR role_label = '')`,
    [
      getRoleLabel(organizationType, "admin"),
      getRoleLabel(organizationType, "petugas"),
      getRoleLabel(organizationType, "user"),
      organizationId
    ]
  );
}

export function buildOrganizationVerificationUrl(token) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.CLIENT_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/verifikasi-instansi?token=${token}`;
}

export function createOrganizationVerificationToken() {
  return randomUUID().replace(/-/g, "");
}

export async function sendOrganizationVerificationEmail({ email, organizationName, verificationUrl }) {
  const subject = `Verifikasi email instansi ${organizationName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Verifikasi instansi ${organizationName}</h2>
      <p>Terima kasih telah mendaftarkan instansi Anda di NgaduAja.</p>
      <p>Silakan verifikasi email dengan menekan tombol berikut:</p>
      <p>
        <a href="${verificationUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;">
          Verifikasi Email Instansi
        </a>
      </p>
      <p>Jika tombol tidak bekerja, buka link berikut:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html
  });
}

export async function activateOrganizationByToken(token) {
  const [rows] = await pool.query(
    `SELECT id, name, status
     FROM organizations
     WHERE verification_token = ?
     LIMIT 1`,
    [token]
  );

  const organization = rows[0];
  if (!organization) {
    return { status: "not_found" };
  }

  if (organization.status === "active") {
    return { status: "already_active", organization };
  }

  await pool.query(
    `UPDATE organizations
     SET status = 'active',
         email_verified_at = NOW(),
         verification_token = NULL
     WHERE id = ?`,
    [organization.id]
  );

  return { status: "activated", organization };
}

export async function resendOrganizationVerification(email) {
  const [rows] = await pool.query(
    `SELECT id, name, contact_email, status
     FROM organizations
     WHERE contact_email = ?
     LIMIT 1`,
    [email]
  );

  const organization = rows[0];
  if (!organization) {
    return { status: "not_found" };
  }

  if (organization.status === "active") {
    return { status: "already_active", organization };
  }

  const token = createOrganizationVerificationToken();
  const verificationUrl = buildOrganizationVerificationUrl(token);

  await pool.query(
    `UPDATE organizations
     SET verification_token = ?,
         verification_sent_at = NOW()
     WHERE id = ?`,
    [token, organization.id]
  );

  const delivery = await sendOrganizationVerificationEmail({
    email: organization.contact_email,
    organizationName: organization.name,
    verificationUrl
  });

  return {
    status: "resent",
    organization,
    verificationUrl,
    delivery
  };
}

export async function createOrganizationAbuseReport({
  organizationId,
  reporterUserId = null,
  reporterEmail = null,
  reason,
  sourceIp = null
}) {
  await pool.query(
    `INSERT INTO organization_abuse_reports (organization_id, reporter_user_id, reporter_email, reason, source_ip)
     VALUES (?, ?, ?, ?, ?)`,
    [organizationId, reporterUserId, reporterEmail, reason, sourceIp]
  );

  const [[counts]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM organization_abuse_reports
     WHERE organization_id = ?`,
    [organizationId]
  );

  const totalReports = Number(counts?.total || 0);
  const shouldFlag = totalReports >= 3;

  if (shouldFlag) {
    await pool.query(
      `UPDATE organizations
       SET status = 'flagged'
       WHERE id = ?
         AND status = 'active'`,
      [organizationId]
    );
  }

  return {
    totalReports,
    flagged: shouldFlag
  };
}

export async function getCategoryByOrganizationType(organizationType, categoryName) {
  const [rows] = await pool.query(
    `SELECT id, name
     FROM categories
     WHERE organization_type = ?
       AND LOWER(name) = LOWER(?)
     LIMIT 1`,
    [organizationType, categoryName]
  );

  return rows[0] || null;
}
