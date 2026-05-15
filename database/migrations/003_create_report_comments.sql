CREATE TABLE IF NOT EXISTS report_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  user_id INT NULL,
  comment TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_comments_report_id (report_id),
  INDEX idx_report_comments_user_id (user_id),
  CONSTRAINT fk_report_comments_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
