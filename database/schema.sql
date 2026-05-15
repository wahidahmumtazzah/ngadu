CREATE DATABASE IF NOT EXISTS ngadu_db;
USE ngadu_db;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);
