-- Stark Laundry starter schema (MySQL 8+ / MariaDB 10.4+)
-- This file defines the first milestone: accounts, services, and laundry orders.

CREATE DATABASE IF NOT EXISTS stark_laundry
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stark_laundry;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('customer', 'admin') NOT NULL,
  username VARCHAR(190) NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NULL,
  password_hash VARCHAR(255) NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_phone (phone),
  KEY ix_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL,
  category ENUM('kiloan', 'satuan', 'dry_clean') NOT NULL,
  unit VARCHAR(24) NOT NULL,
  price_per_unit DECIMAL(12,2) NOT NULL,
  minimum_quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  estimated_hours SMALLINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_services_active_category (is_active, category),
  CONSTRAINT chk_services_price_nonnegative CHECK (price_per_unit >= 0),
  CONSTRAINT chk_services_minimum_positive CHECK (minimum_quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  receipt_code VARCHAR(32) NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(24) NOT NULL,
  status ENUM('new', 'processing', 'ready_for_pickup', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
  payment_method ENUM('cash', 'qris', 'transfer', 'other') NULL,
  payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ready_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_receipt_code (receipt_code),
  KEY ix_orders_customer_status (customer_id, status, created_at),
  KEY ix_orders_status_created (status, created_at),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT chk_orders_amounts_nonnegative CHECK (subtotal >= 0 AND total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NULL,
  service_name_snapshot VARCHAR(140) NOT NULL,
  unit_snapshot VARCHAR(24) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_order_items_order (order_id),
  KEY ix_order_items_service (service_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_amounts CHECK (unit_price >= 0 AND line_total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  previous_status ENUM('new', 'processing', 'ready_for_pickup', 'completed', 'cancelled') NULL,
  new_status ENUM('new', 'processing', 'ready_for_pickup', 'completed', 'cancelled') NOT NULL,
  note VARCHAR(500) NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_order_status_history_order_time (order_id, changed_at),
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_qr_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NULL,
  pickup_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_qr_order (order_id),
  UNIQUE KEY uq_order_qr_token_hash (token_hash),
  CONSTRAINT fk_order_qr_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB;
