SET @org_name_normalized_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'name_normalized'
);

SET @org_name_normalized_sql = IF(
  @org_name_normalized_exists = 0,
  'ALTER TABLE organizations ADD COLUMN name_normalized VARCHAR(190) NULL AFTER name',
  'SELECT 1'
);

PREPARE org_name_normalized_stmt FROM @org_name_normalized_sql;
EXECUTE org_name_normalized_stmt;
DEALLOCATE PREPARE org_name_normalized_stmt;

UPDATE organizations
SET name_normalized = LOWER(TRIM(name))
WHERE name_normalized IS NULL OR name_normalized = '';

SET @org_name_normalized_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND INDEX_NAME = 'uq_organizations_name_normalized'
);

SET @org_name_normalized_index_sql = IF(
  @org_name_normalized_index_exists = 0,
  'CREATE UNIQUE INDEX uq_organizations_name_normalized ON organizations(name_normalized)',
  'SELECT 1'
);

PREPARE org_name_normalized_index_stmt FROM @org_name_normalized_index_sql;
EXECUTE org_name_normalized_index_stmt;
DEALLOCATE PREPARE org_name_normalized_index_stmt;
