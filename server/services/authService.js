import { pool } from "../config/db.js";
import { getPlatformConfig, resolveRoleOption } from "../../lib/platform-config.js";

function formatUserPayload(user) {
  return {
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
          address: user.organization_address,
          status: user.organization_status,
          platformLabel: getPlatformConfig(user.organization_type).label
        }
      : null,
    defaultAnonymous: Boolean(user.default_anonymous),
    isVerified: Boolean(user.is_verified),
    isSuspended: Boolean(user.is_suspended),
    firebaseUid: user.firebase_uid || null
  };
}

async function loadUserByClause(clause, values) {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.firebase_uid,
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
      o.address AS organization_address,
      o.status AS organization_status,
      o.email_verified_at AS organization_email_verified_at
     FROM users u
     LEFT JOIN organizations o ON u.organization_id = o.id
     WHERE ${clause}
     LIMIT 1`,
    values
  );

  return rows[0] || null;
}

async function activateOrganizationIfEligible(user, emailVerified) {
  if (
    user?.role === "admin" &&
    user.organization_id &&
    user.organization_status === "pending_verification" &&
    emailVerified
  ) {
    await pool.query(
      `UPDATE organizations
       SET status = 'active',
           email_verified_at = COALESCE(email_verified_at, NOW()),
           verification_token = NULL,
           verification_sent_at = NULL
       WHERE id = ?`,
      [user.organization_id]
    );

    return loadUserByClause("u.id = ?", [user.id]);
  }

  return user;
}

export async function syncAppUserSession({ firebaseUid, email, emailVerified }) {
  let user = null;

  if (firebaseUid) {
    user = await loadUserByClause("u.firebase_uid = ?", [firebaseUid]);
  }

  if (!user && email) {
    user = await loadUserByClause("u.email = ?", [email]);

    if (user && !user.firebase_uid) {
      await pool.query(
        `UPDATE users
         SET firebase_uid = ?,
             is_verified = ?
         WHERE id = ?`,
        [firebaseUid, emailVerified ? 1 : 0, user.id]
      );
      user = await loadUserByClause("u.id = ?", [user.id]);
    }
  }

  if (!user) return null;

  user = await activateOrganizationIfEligible(user, emailVerified);

  await pool.query(
    `UPDATE users
     SET is_verified = ?
     WHERE id = ?`,
    [emailVerified ? 1 : 0, user.id]
  );

  return formatUserPayload(user);
}

export async function registerUser({ firebaseUid, email, emailVerified, name, organizationId, roleLabel }) {
  if (!firebaseUid || !email) {
    throw new Error("Sesi Firebase tidak valid.");
  }

  const [existingByUid] = await pool.query("SELECT id FROM users WHERE firebase_uid = ?", [firebaseUid]);
  if (existingByUid.length > 0) {
    throw new Error("Akun Firebase ini sudah terhubung.");
  }

  const [existingByEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existingByEmail.length > 0) {
    throw new Error("Email sudah terdaftar.");
  }

  if (!organizationId) {
    throw new Error("Instansi wajib dipilih.");
  }

  const [organizations] = await pool.query(
    "SELECT id, type, name, custom_type_label, logo_url, address FROM organizations WHERE id = ?",
    [organizationId]
  );
  const organization = organizations[0];
  if (!organization) {
    throw new Error("Instansi tidak ditemukan.");
  }

  const resolvedRole = resolveRoleOption(organization.type, roleLabel);
  const [result] = await pool.query(
    `INSERT INTO users (firebase_uid, organization_id, name, email, password_hash, role, role_label, is_verified)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
    [firebaseUid, organizationId, name, email, resolvedRole.systemRole, resolvedRole.label, emailVerified ? 1 : 0]
  );

  return {
    id: result.insertId,
    name,
    email,
    role: resolvedRole.systemRole,
    roleLabel: resolvedRole.label,
    organizationId: organization.id,
    organization: {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      customTypeLabel: organization.custom_type_label,
      logoUrl: organization.logo_url,
      address: organization.address,
      platformLabel: getPlatformConfig(organization.type).label
    },
    defaultAnonymous: true,
    isVerified: emailVerified,
    isSuspended: false,
    firebaseUid
  };
}
