import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
    isSuspended: Boolean(user.is_suspended)
  };
}

export async function registerUser({ name, email, password, organizationId, roleLabel }) {
  const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (exists.length > 0) {
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
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO users (organization_id, name, email, password_hash, role, role_label)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [organizationId, name, email, passwordHash, resolvedRole.systemRole, resolvedRole.label]
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
    isVerified: false,
    isSuspended: false
  };
}

export async function loginUser({ email, password }) {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.organization_id,
      u.name,
      u.email,
      u.password_hash,
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
     WHERE u.email = ?`,
    [email]
  );

  const user = rows[0];
  if (!user) {
    throw new Error("Email atau password tidak valid.");
  }

  if (user.is_suspended) {
    throw new Error("Akun ini sedang dinonaktifkan oleh admin.");
  }

  if (user.role !== "super_admin" && (user.organization_status !== "active" || !user.organization_email_verified_at)) {
    throw new Error("Instansi belum aktif. Silakan verifikasi email organisasi terlebih dahulu.");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Email atau password tidak valid.");
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: user.role_label,
      organizationId: user.organization_id,
      organizationType: user.organization_type
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: formatUserPayload(user)
  };
}
