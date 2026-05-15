ALTER TABLE users
MODIFY COLUMN role ENUM('user', 'petugas', 'admin', 'super_admin') NOT NULL DEFAULT 'user';

SET @organizations_review_note_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'review_note'
);

SET @organizations_review_note_sql = IF(
  @organizations_review_note_exists = 0,
  'ALTER TABLE organizations ADD COLUMN review_note TEXT NULL AFTER email_verified_at',
  'SELECT 1'
);

PREPARE organizations_review_note_stmt FROM @organizations_review_note_sql;
EXECUTE organizations_review_note_stmt;
DEALLOCATE PREPARE organizations_review_note_stmt;

SET @organizations_status_updated_at_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'status_updated_at'
);

SET @organizations_status_updated_at_sql = IF(
  @organizations_status_updated_at_exists = 0,
  'ALTER TABLE organizations ADD COLUMN status_updated_at TIMESTAMP NULL DEFAULT NULL AFTER review_note',
  'SELECT 1'
);

PREPARE organizations_status_updated_at_stmt FROM @organizations_status_updated_at_sql;
EXECUTE organizations_status_updated_at_stmt;
DEALLOCATE PREPARE organizations_status_updated_at_stmt;

SET @organizations_status_updated_by_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'status_updated_by'
);

SET @organizations_status_updated_by_sql = IF(
  @organizations_status_updated_by_exists = 0,
  'ALTER TABLE organizations ADD COLUMN status_updated_by INT NULL AFTER status_updated_at',
  'SELECT 1'
);

PREPARE organizations_status_updated_by_stmt FROM @organizations_status_updated_by_sql;
EXECUTE organizations_status_updated_by_stmt;
DEALLOCATE PREPARE organizations_status_updated_by_stmt;
