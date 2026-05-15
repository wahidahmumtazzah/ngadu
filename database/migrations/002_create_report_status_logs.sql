CREATE TABLE IF NOT EXISTS report_status_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  from_status ENUM('terkirim', 'diproses', 'selesai', 'ditolak') NULL,
  to_status ENUM('terkirim', 'diproses', 'selesai', 'ditolak') NOT NULL,
  changed_by INT NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status_logs_report_id (report_id),
  INDEX idx_status_logs_changed_by (changed_by),
  CONSTRAINT fk_status_logs_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_logs_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);
