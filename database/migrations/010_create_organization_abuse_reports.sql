CREATE TABLE IF NOT EXISTS organization_abuse_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  reporter_user_id INT NULL,
  reporter_email VARCHAR(180) NULL,
  reason TEXT NOT NULL,
  source_ip VARCHAR(80) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_org_abuse_reports_organization_id (organization_id),
  INDEX idx_org_abuse_reports_reporter_user_id (reporter_user_id),
  CONSTRAINT fk_org_abuse_reports_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_abuse_reports_reporter_user FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL
);
