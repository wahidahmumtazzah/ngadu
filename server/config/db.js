import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const baseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool({
  ...baseConfig,
  database: process.env.DB_NAME
});

export async function initializeDatabase() {
  const dbName = process.env.DB_NAME;
  const rootPool = mysql.createPool(baseConfig);

  await rootPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await rootPool.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      default_anonymous TINYINT(1) NOT NULL DEFAULT 1,
      role ENUM('user', 'petugas', 'admin') NOT NULL DEFAULT 'user',
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      is_suspended TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE users
    MODIFY COLUMN role ENUM('user', 'petugas', 'admin') NOT NULL DEFAULT 'user'
  `);

  const [defaultAnonymousColumn] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'default_anonymous'`,
    [dbName]
  );

  if (defaultAnonymousColumn.length === 0) {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN default_anonymous TINYINT(1) NOT NULL DEFAULT 1
    `);
  }

  const userColumns = [
    {
      name: "is_verified",
      definition: "ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0"
    },
    {
      name: "is_suspended",
      definition: "ADD COLUMN is_suspended TINYINT(1) NOT NULL DEFAULT 0"
    }
  ];

  for (const column of userColumns) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = ?`,
      [dbName, column.name]
    );

    if (rows.length === 0) {
      await pool.query(`ALTER TABLE users ${column.definition}`);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      category ENUM('fasilitas rusak', 'bullying', 'kebersihan', 'keamanan', 'pelayanan', 'lingkungan') NOT NULL,
      edit_token VARCHAR(64) NULL,
      location VARCHAR(190) NOT NULL,
      detail_location VARCHAR(255) NULL,
      description TEXT NOT NULL,
      photo_url VARCHAR(255) NULL,
      urgency ENUM('rendah', 'sedang', 'tinggi') NOT NULL,
      is_emergency TINYINT(1) NOT NULL DEFAULT 0,
      emergency_type VARCHAR(190) NULL,
      danger_level ENUM('sedang', 'tinggi', 'kritis') NULL,
      needs_immediate_help TINYINT(1) NOT NULL DEFAULT 0,
      is_anonymous TINYINT(1) NOT NULL DEFAULT 1,
      status ENUM('terkirim', 'diproses', 'selesai', 'ditolak') NOT NULL DEFAULT 'terkirim',
      admin_note TEXT NULL,
      assigned_to INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_reports_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    ALTER TABLE reports
    MODIFY COLUMN status ENUM('terkirim', 'diproses', 'selesai', 'ditolak') NOT NULL DEFAULT 'terkirim'
  `);

  const reportColumns = [
    {
      name: "is_emergency",
      definition: "ADD COLUMN is_emergency TINYINT(1) NOT NULL DEFAULT 0"
    },
    {
      name: "emergency_type",
      definition: "ADD COLUMN emergency_type VARCHAR(190) NULL"
    },
    {
      name: "danger_level",
      definition: "ADD COLUMN danger_level ENUM('sedang', 'tinggi', 'kritis') NULL"
    },
    {
      name: "needs_immediate_help",
      definition: "ADD COLUMN needs_immediate_help TINYINT(1) NOT NULL DEFAULT 0"
    },
    {
      name: "detail_location",
      definition: "ADD COLUMN detail_location VARCHAR(255) NULL"
    },
    {
      name: "edit_token",
      definition: "ADD COLUMN edit_token VARCHAR(64) NULL"
    },
    {
      name: "admin_note",
      definition: "ADD COLUMN admin_note TEXT NULL"
    },
    {
      name: "assigned_to",
      definition: "ADD COLUMN assigned_to INT NULL"
    }
  ];

  for (const column of reportColumns) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME = 'reports'
         AND COLUMN_NAME = ?`,
      [dbName, column.name]
    );

    if (rows.length === 0) {
      await pool.query(`ALTER TABLE reports ${column.definition}`);
    }
  }

  const [assignedFk] = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'reports'
       AND COLUMN_NAME = 'assigned_to'
       AND REFERENCED_TABLE_NAME = 'users'`,
    [dbName]
  );

  if (assignedFk.length === 0) {
    await pool.query(`
      ALTER TABLE reports
      ADD CONSTRAINT fk_reports_assignee
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    `);
  }
}
