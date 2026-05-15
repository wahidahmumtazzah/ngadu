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

ALTER TABLE users
MODIFY COLUMN role ENUM('user', 'petugas', 'admin') NOT NULL DEFAULT 'user';

SET @users_default_anonymous_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'default_anonymous'
);

SET @users_default_anonymous_sql = IF(
  @users_default_anonymous_exists = 0,
  'ALTER TABLE users ADD COLUMN default_anonymous TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1'
);

PREPARE users_default_anonymous_stmt FROM @users_default_anonymous_sql;
EXECUTE users_default_anonymous_stmt;
DEALLOCATE PREPARE users_default_anonymous_stmt;

SET @users_is_verified_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'is_verified'
);

SET @users_is_verified_sql = IF(
  @users_is_verified_exists = 0,
  'ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE users_is_verified_stmt FROM @users_is_verified_sql;
EXECUTE users_is_verified_stmt;
DEALLOCATE PREPARE users_is_verified_stmt;

SET @users_is_suspended_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'is_suspended'
);

SET @users_is_suspended_sql = IF(
  @users_is_suspended_exists = 0,
  'ALTER TABLE users ADD COLUMN is_suspended TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE users_is_suspended_stmt FROM @users_is_suspended_sql;
EXECUTE users_is_suspended_stmt;
DEALLOCATE PREPARE users_is_suspended_stmt;

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

ALTER TABLE reports
MODIFY COLUMN status ENUM('terkirim', 'diproses', 'selesai', 'ditolak') NOT NULL DEFAULT 'terkirim';

SET @reports_is_emergency_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'is_emergency'
);

SET @reports_is_emergency_sql = IF(
  @reports_is_emergency_exists = 0,
  'ALTER TABLE reports ADD COLUMN is_emergency TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE reports_is_emergency_stmt FROM @reports_is_emergency_sql;
EXECUTE reports_is_emergency_stmt;
DEALLOCATE PREPARE reports_is_emergency_stmt;

SET @reports_emergency_type_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'emergency_type'
);

SET @reports_emergency_type_sql = IF(
  @reports_emergency_type_exists = 0,
  'ALTER TABLE reports ADD COLUMN emergency_type VARCHAR(190) NULL',
  'SELECT 1'
);

PREPARE reports_emergency_type_stmt FROM @reports_emergency_type_sql;
EXECUTE reports_emergency_type_stmt;
DEALLOCATE PREPARE reports_emergency_type_stmt;

SET @reports_danger_level_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'danger_level'
);

SET @reports_danger_level_sql = IF(
  @reports_danger_level_exists = 0,
  'ALTER TABLE reports ADD COLUMN danger_level ENUM(''sedang'', ''tinggi'', ''kritis'') NULL',
  'SELECT 1'
);

PREPARE reports_danger_level_stmt FROM @reports_danger_level_sql;
EXECUTE reports_danger_level_stmt;
DEALLOCATE PREPARE reports_danger_level_stmt;

SET @reports_needs_immediate_help_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'needs_immediate_help'
);

SET @reports_needs_immediate_help_sql = IF(
  @reports_needs_immediate_help_exists = 0,
  'ALTER TABLE reports ADD COLUMN needs_immediate_help TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE reports_needs_immediate_help_stmt FROM @reports_needs_immediate_help_sql;
EXECUTE reports_needs_immediate_help_stmt;
DEALLOCATE PREPARE reports_needs_immediate_help_stmt;

SET @reports_detail_location_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'detail_location'
);

SET @reports_detail_location_sql = IF(
  @reports_detail_location_exists = 0,
  'ALTER TABLE reports ADD COLUMN detail_location VARCHAR(255) NULL',
  'SELECT 1'
);

PREPARE reports_detail_location_stmt FROM @reports_detail_location_sql;
EXECUTE reports_detail_location_stmt;
DEALLOCATE PREPARE reports_detail_location_stmt;

SET @reports_edit_token_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'edit_token'
);

SET @reports_edit_token_sql = IF(
  @reports_edit_token_exists = 0,
  'ALTER TABLE reports ADD COLUMN edit_token VARCHAR(64) NULL',
  'SELECT 1'
);

PREPARE reports_edit_token_stmt FROM @reports_edit_token_sql;
EXECUTE reports_edit_token_stmt;
DEALLOCATE PREPARE reports_edit_token_stmt;

SET @reports_admin_note_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'admin_note'
);

SET @reports_admin_note_sql = IF(
  @reports_admin_note_exists = 0,
  'ALTER TABLE reports ADD COLUMN admin_note TEXT NULL',
  'SELECT 1'
);

PREPARE reports_admin_note_stmt FROM @reports_admin_note_sql;
EXECUTE reports_admin_note_stmt;
DEALLOCATE PREPARE reports_admin_note_stmt;

SET @reports_assigned_to_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'assigned_to'
);

SET @reports_assigned_to_sql = IF(
  @reports_assigned_to_exists = 0,
  'ALTER TABLE reports ADD COLUMN assigned_to INT NULL',
  'SELECT 1'
);

PREPARE reports_assigned_to_stmt FROM @reports_assigned_to_sql;
EXECUTE reports_assigned_to_stmt;
DEALLOCATE PREPARE reports_assigned_to_stmt;

SET @fk_reports_assignee_exists = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND CONSTRAINT_NAME = 'fk_reports_assignee'
);

SET @fk_reports_assignee_sql = IF(
  @fk_reports_assignee_exists = 0,
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE fk_reports_assignee_stmt FROM @fk_reports_assignee_sql;
EXECUTE fk_reports_assignee_stmt;
DEALLOCATE PREPARE fk_reports_assignee_stmt;
