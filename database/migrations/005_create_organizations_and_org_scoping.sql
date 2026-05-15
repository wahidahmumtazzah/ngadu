CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  type ENUM('school', 'campus', 'community', 'boarding_house', 'office', 'custom') NOT NULL DEFAULT 'custom',
  custom_type_label VARCHAR(120) NULL,
  logo_url VARCHAR(255) NULL,
  address TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_type ENUM('school', 'campus', 'community', 'boarding_house', 'office', 'custom') NOT NULL,
  name VARCHAR(120) NOT NULL,
  icon VARCHAR(80) NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_type_name (organization_type, name)
);

SET @users_organization_id_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'organization_id'
);

SET @users_organization_id_sql = IF(
  @users_organization_id_exists = 0,
  'ALTER TABLE users ADD COLUMN organization_id INT NULL AFTER email',
  'SELECT 1'
);

PREPARE users_organization_id_stmt FROM @users_organization_id_sql;
EXECUTE users_organization_id_stmt;
DEALLOCATE PREPARE users_organization_id_stmt;

SET @users_role_label_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role_label'
);

SET @users_role_label_sql = IF(
  @users_role_label_exists = 0,
  'ALTER TABLE users ADD COLUMN role_label VARCHAR(120) NULL AFTER role',
  'SELECT 1'
);

PREPARE users_role_label_stmt FROM @users_role_label_sql;
EXECUTE users_role_label_stmt;
DEALLOCATE PREPARE users_role_label_stmt;

SET @reports_organization_id_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'organization_id'
);

SET @reports_organization_id_sql = IF(
  @reports_organization_id_exists = 0,
  'ALTER TABLE reports ADD COLUMN organization_id INT NULL AFTER user_id',
  'SELECT 1'
);

PREPARE reports_organization_id_stmt FROM @reports_organization_id_sql;
EXECUTE reports_organization_id_stmt;
DEALLOCATE PREPARE reports_organization_id_stmt;

SET @reports_category_id_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'category_id'
);

SET @reports_category_id_sql = IF(
  @reports_category_id_exists = 0,
  'ALTER TABLE reports ADD COLUMN category_id INT NULL AFTER category',
  'SELECT 1'
);

PREPARE reports_category_id_stmt FROM @reports_category_id_sql;
EXECUTE reports_category_id_stmt;
DEALLOCATE PREPARE reports_category_id_stmt;

SET @reports_title_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND COLUMN_NAME = 'title'
);

SET @reports_title_sql = IF(
  @reports_title_exists = 0,
  'ALTER TABLE reports ADD COLUMN title VARCHAR(190) NULL AFTER category_id',
  'SELECT 1'
);

PREPARE reports_title_stmt FROM @reports_title_sql;
EXECUTE reports_title_stmt;
DEALLOCATE PREPARE reports_title_stmt;

SET @fk_users_organization_exists = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'fk_users_organization'
);

SET @fk_users_organization_sql = IF(
  @fk_users_organization_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE fk_users_organization_stmt FROM @fk_users_organization_sql;
EXECUTE fk_users_organization_stmt;
DEALLOCATE PREPARE fk_users_organization_stmt;

SET @fk_reports_organization_exists = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND CONSTRAINT_NAME = 'fk_reports_organization'
);

SET @fk_reports_organization_sql = IF(
  @fk_reports_organization_exists = 0,
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE fk_reports_organization_stmt FROM @fk_reports_organization_sql;
EXECUTE fk_reports_organization_stmt;
DEALLOCATE PREPARE fk_reports_organization_stmt;

SET @fk_reports_category_exists = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reports'
    AND CONSTRAINT_NAME = 'fk_reports_category'
);

SET @fk_reports_category_sql = IF(
  @fk_reports_category_exists = 0,
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE fk_reports_category_stmt FROM @fk_reports_category_sql;
EXECUTE fk_reports_category_stmt;
DEALLOCATE PREPARE fk_reports_category_stmt;
