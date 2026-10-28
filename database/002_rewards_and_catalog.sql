USE stark_laundry;

-- Starter catalog used by the POS. Existing catalog rows are kept as-is.
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Cuci Lipat Reguler','kiloan','/ Kg',7000,1,48,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Cuci Lipat Reguler');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Cuci Setrika Express','kiloan','/ Kg',12000,1,24,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Cuci Setrika Express');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Cuci Kilat Super Express','kiloan','/ Kg',20000,1,8,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Cuci Kilat Super Express');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Bed Cover & Selimut','satuan','/ Pcs',25000,1,48,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Bed Cover & Selimut');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Jas & Kemeja Formal','dry_clean','/ Pcs',30000,1,72,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Jas & Kemeja Formal');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Karpet Tebal Ruang Tamu','satuan','/ m²',50000,1,120,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Karpet Tebal Ruang Tamu');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Sepatu & Sneakers Premium','dry_clean','/ Pasang',35000,1,72,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Sepatu & Sneakers Premium');
INSERT INTO services (name,category,unit,price_per_unit,minimum_quantity,estimated_hours,is_active)
SELECT 'Gorden & Vitrase Lembut','satuan','/ Kg',18000,1,72,TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Gorden & Vitrase Lembut');

-- Add reward and point records without replacing existing accounts or orders.
CREATE TABLE IF NOT EXISTS rewards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  category ENUM('voucher', 'product', 'service') NOT NULL DEFAULT 'voucher',
  point_cost INT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_rewards_active_cost (is_active, point_cost)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reward_id BIGINT UNSIGNED NULL,
  reward_name_snapshot VARCHAR(140) NOT NULL,
  points_spent INT UNSIGNED NOT NULL,
  status ENUM('active', 'redeemed', 'cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  redeemed_at TIMESTAMP NULL,
  processed_by BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reward_redemptions_code (code),
  KEY ix_reward_redemptions_user_status (user_id, status, created_at),
  CONSTRAINT fk_reward_redemptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reward_redemptions_reward FOREIGN KEY (reward_id) REFERENCES rewards (id) ON DELETE SET NULL,
  CONSTRAINT fk_reward_redemptions_admin FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS point_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  redemption_id BIGINT UNSIGNED NULL,
  event_type ENUM('earned', 'spent', 'adjustment') NOT NULL,
  points_delta INT NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_point_ledger_order (order_id),
  UNIQUE KEY uq_point_ledger_redemption (redemption_id),
  KEY ix_point_ledger_user_time (user_id, created_at),
  CONSTRAINT fk_point_ledger_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_point_ledger_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
  CONSTRAINT fk_point_ledger_redemption FOREIGN KEY (redemption_id) REFERENCES reward_redemptions (id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO rewards (name, description, category, point_cost, is_active)
SELECT 'Voucher Laundry Rp10.000', 'Potongan Rp10.000 untuk transaksi laundry berikutnya.', 'voucher', 100, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Voucher Laundry Rp10.000');
INSERT INTO rewards (name, description, category, point_cost, is_active)
SELECT 'Kantong Laundry Eksklusif Anti-Air', 'Kantong laundry praktis untuk membawa pakaian.', 'product', 80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Kantong Laundry Eksklusif Anti-Air');
INSERT INTO rewards (name, description, category, point_cost, is_active)
SELECT 'Voucher Laundry Rp25.000', 'Potongan Rp25.000 untuk transaksi laundry berikutnya.', 'voucher', 200, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Voucher Laundry Rp25.000');
INSERT INTO rewards (name, description, category, point_cost, is_active)
SELECT 'Pewangi Laundry 250 ml', 'Pewangi pakaian pilihan untuk penggunaan di rumah.', 'product', 150, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Pewangi Laundry 250 ml');
INSERT INTO rewards (name, description, category, point_cost, is_active)
SELECT 'Gratis Laundry Kiloan Maks. 4 Kg', 'Gratis satu layanan kiloan hingga 4 kg.', 'service', 300, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'Gratis Laundry Kiloan Maks. 4 Kg');

-- Backfill points once for completed orders that were already linked to customer accounts.
INSERT IGNORE INTO point_ledger (user_id,order_id,event_type,points_delta,note)
SELECT customer_id,id,'earned',FLOOR(total/1000),'Poin dari pesanan selesai (data sebelumnya)'
FROM orders WHERE status='completed' AND customer_id IS NOT NULL AND FLOOR(total/1000)>0;
