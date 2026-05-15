ALTER TABLE reports
MODIFY COLUMN status ENUM('terkirim', 'diproses', 'menunggu_korban', 'selesai', 'ditolak') NOT NULL DEFAULT 'terkirim';

ALTER TABLE report_status_logs
MODIFY COLUMN from_status ENUM('terkirim', 'diproses', 'menunggu_korban', 'selesai', 'ditolak') NULL;

ALTER TABLE report_status_logs
MODIFY COLUMN to_status ENUM('terkirim', 'diproses', 'menunggu_korban', 'selesai', 'ditolak') NOT NULL;

CREATE TABLE IF NOT EXISTS report_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  sender_id INT NULL,
  sender_role VARCHAR(50) NULL,
  message TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_replies_report_id (report_id),
  INDEX idx_report_replies_sender_id (sender_id),
  CONSTRAINT fk_report_replies_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_replies_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);
