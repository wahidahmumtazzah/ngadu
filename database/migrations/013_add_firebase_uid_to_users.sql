SET @users_firebase_uid_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'firebase_uid'
);

SET @users_firebase_uid_sql = IF(
  @users_firebase_uid_exists = 0,
  'ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(191) NULL AFTER email',
  'SELECT 1'
);

PREPARE users_firebase_uid_stmt FROM @users_firebase_uid_sql;
EXECUTE users_firebase_uid_stmt;
DEALLOCATE PREPARE users_firebase_uid_stmt;

SET @users_password_hash_nullable_sql = 'ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL';
PREPARE users_password_hash_nullable_stmt FROM @users_password_hash_nullable_sql;
EXECUTE users_password_hash_nullable_stmt;
DEALLOCATE PREPARE users_password_hash_nullable_stmt;

SET @users_firebase_uid_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'uq_users_firebase_uid'
);

SET @users_firebase_uid_index_sql = IF(
  @users_firebase_uid_index_exists = 0,
  'ALTER TABLE users ADD UNIQUE KEY uq_users_firebase_uid (firebase_uid)',
  'SELECT 1'
);

PREPARE users_firebase_uid_index_stmt FROM @users_firebase_uid_index_sql;
EXECUTE users_firebase_uid_index_stmt;
DEALLOCATE PREPARE users_firebase_uid_index_stmt;
