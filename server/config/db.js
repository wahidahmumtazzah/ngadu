import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../../database/migrations");

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

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME;
  const rootPool = mysql.createPool(baseConfig);
  await rootPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await rootPool.end();
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runSqlMigration(filename) {
  const filepath = path.join(migrationsDir, filename);
  const sql = await fs.readFile(filepath, "utf8");
  const statements = splitSqlStatements(sql);

  for (const statement of statements) {
    await pool.query(statement);
  }

  await pool.query("INSERT INTO schema_migrations (filename) VALUES (?)", [filename]);
}

export async function runMigrations() {
  await ensureDatabaseExists();
  await ensureMigrationsTable();

  const [rows] = await pool.query("SELECT filename FROM schema_migrations");
  const completed = new Set(rows.map((row) => row.filename));
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  for (const file of files) {
    if (completed.has(file)) continue;
    await runSqlMigration(file);
  }
}

export async function initializeDatabase() {
  await runMigrations();
}
