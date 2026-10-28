-- Starter admin accounts for the college project.
-- Password hashes are intentionally left empty until the backend's password
-- hashing method is in place. Keep these accounts inactive until then.

USE stark_laundry;

INSERT INTO users (role, username, full_name, phone, password_hash, must_change_password, is_active)
VALUES
  ('admin', 'adm_01', 'Admin 01', NULL, NULL, TRUE, FALSE),
  ('admin', 'adm_02', 'Admin 02', NULL, NULL, TRUE, FALSE)
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  must_change_password = TRUE;
