import { loginUser, registerUser } from "../services/authService.js";
import { pool } from "../config/db.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password wajib diisi." });
    }

    const user = await registerUser({ name, email, password });
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
      "SELECT id, name, email, role, default_anonymous FROM users WHERE id = ?",
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
        defaultAnonymous: Boolean(user.default_anonymous)
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
      "SELECT id, name, email, role, default_anonymous FROM users WHERE id = ?",
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
        defaultAnonymous: Boolean(user.default_anonymous)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui profil user." });
  }
}
