SET @org_phone_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'phone'
);

SET @org_phone_sql = IF(
  @org_phone_exists = 0,
  'ALTER TABLE organizations ADD COLUMN phone VARCHAR(50) NULL AFTER contact_email',
  'SELECT 1'
);

PREPARE org_phone_stmt FROM @org_phone_sql;
EXECUTE org_phone_stmt;
DEALLOCATE PREPARE org_phone_stmt;
