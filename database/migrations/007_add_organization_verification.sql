SET @org_contact_email_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'contact_email'
);

SET @org_contact_email_sql = IF(
  @org_contact_email_exists = 0,
  'ALTER TABLE organizations ADD COLUMN contact_email VARCHAR(180) NULL AFTER address',
  'SELECT 1'
);

PREPARE org_contact_email_stmt FROM @org_contact_email_sql;
EXECUTE org_contact_email_stmt;
DEALLOCATE PREPARE org_contact_email_stmt;

SET @org_status_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'status'
);

SET @org_status_sql = IF(
  @org_status_exists = 0,
  'ALTER TABLE organizations ADD COLUMN status ENUM(''pending_verification'', ''active'', ''flagged'', ''suspended'') NOT NULL DEFAULT ''pending_verification'' AFTER contact_email',
  'SELECT 1'
);

PREPARE org_status_stmt FROM @org_status_sql;
EXECUTE org_status_stmt;
DEALLOCATE PREPARE org_status_stmt;

SET @org_verification_token_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'verification_token'
);

SET @org_verification_token_sql = IF(
  @org_verification_token_exists = 0,
  'ALTER TABLE organizations ADD COLUMN verification_token VARCHAR(120) NULL AFTER status',
  'SELECT 1'
);

PREPARE org_verification_token_stmt FROM @org_verification_token_sql;
EXECUTE org_verification_token_stmt;
DEALLOCATE PREPARE org_verification_token_stmt;

SET @org_verification_sent_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'verification_sent_at'
);

SET @org_verification_sent_sql = IF(
  @org_verification_sent_exists = 0,
  'ALTER TABLE organizations ADD COLUMN verification_sent_at TIMESTAMP NULL AFTER verification_token',
  'SELECT 1'
);

PREPARE org_verification_sent_stmt FROM @org_verification_sent_sql;
EXECUTE org_verification_sent_stmt;
DEALLOCATE PREPARE org_verification_sent_stmt;

SET @org_email_verified_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'email_verified_at'
);

SET @org_email_verified_sql = IF(
  @org_email_verified_exists = 0,
  'ALTER TABLE organizations ADD COLUMN email_verified_at TIMESTAMP NULL AFTER verification_sent_at',
  'SELECT 1'
);

PREPARE org_email_verified_stmt FROM @org_email_verified_sql;
EXECUTE org_email_verified_stmt;
DEALLOCATE PREPARE org_email_verified_stmt;

SET @org_contact_email_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND INDEX_NAME = 'uq_organizations_contact_email'
);

SET @org_contact_email_index_sql = IF(
  @org_contact_email_index_exists = 0,
  'CREATE UNIQUE INDEX uq_organizations_contact_email ON organizations(contact_email)',
  'SELECT 1'
);

PREPARE org_contact_email_index_stmt FROM @org_contact_email_index_sql;
EXECUTE org_contact_email_index_stmt;
DEALLOCATE PREPARE org_contact_email_index_stmt;

SET @org_verification_token_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND INDEX_NAME = 'uq_organizations_verification_token'
);

SET @org_verification_token_index_sql = IF(
  @org_verification_token_index_exists = 0,
  'CREATE UNIQUE INDEX uq_organizations_verification_token ON organizations(verification_token)',
  'SELECT 1'
);

PREPARE org_verification_token_index_stmt FROM @org_verification_token_index_sql;
EXECUTE org_verification_token_index_stmt;
DEALLOCATE PREPARE org_verification_token_index_stmt;
