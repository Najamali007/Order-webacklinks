-- =========================================================
-- 🔗 SEO BACKLINK ORDERING PLATFORM - DATABASE SCHEMA (MySQL)
-- Compatibility: MySQL 5.7+ / 8.0+ / MariaDB
-- Hostinger phpMyAdmin Compatible
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `deposit_requests`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- 1. Table: `users`
-- ---------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  `balance` DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active' NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 2. Table: `orders`
-- ---------------------------------------------------------
CREATE TABLE `orders` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_email` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `total_cost` DECIMAL(15,2) NOT NULL,
  `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `pdf_report` VARCHAR(255) DEFAULT NULL,
  `delivery_link` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `completion_date` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3. Table: `deposit_requests`
-- ---------------------------------------------------------
CREATE TABLE `deposit_requests` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_email` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL,
  `screenshot` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_deposits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 4. Table: `notifications`
-- ---------------------------------------------------------
CREATE TABLE `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) DEFAULT NULL,
  `role` ENUM('user', 'admin', 'all') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0 NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 5. Table: `settings`
-- ---------------------------------------------------------
CREATE TABLE `settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `website_name` VARCHAR(100) NOT NULL DEFAULT 'SEO Backlink Hub',
  `logo` VARCHAR(100) NOT NULL DEFAULT '🔗 BacklinkHub',
  `currency` VARCHAR(20) NOT NULL DEFAULT 'PKR',
  `deposit_instructions` TEXT NOT NULL,
  `contact_email` VARCHAR(150) NOT NULL DEFAULT 'support@backlinkhub.com',
  `smtp_email` VARCHAR(150) DEFAULT '',
  `smtp_host` VARCHAR(150) DEFAULT '',
  `smtp_port` INT DEFAULT 587,
  `smtp_user` VARCHAR(150) DEFAULT '',
  `smtp_pass` VARCHAR(150) DEFAULT '',
  `price_web20` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `price_web20_profile` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `price_web_dirs` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `price_wiki` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `price_bookmarks` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `price_listings` DECIMAL(10,2) NOT NULL DEFAULT 30.00,
  `price_mixed` DECIMAL(10,2) NOT NULL DEFAULT 30.00,
  `price_pdf` DECIMAL(10,2) NOT NULL DEFAULT 40.00,
  `price_article` DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 🗄️ INITIAL DATA SEEDING (Bcrypt Encrypted Passwords)
-- ---------------------------------------------------------

-- Admin Seed: admin@backlink.com / password: admin123
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `balance`, `status`, `created_at`) 
VALUES ('usr_admin', 'Platform Admin', 'admin@backlink.com', '$2a$10$T1K7L6h7qQ8g6x1T.9Z7UOyfUv4iB8t8hO/3L1z1lI6O3uI5Oa8qS', '+923001234567', 'admin', 100000.00, 'active', NOW());

-- Regular Client Seed: user@backlink.com / password: user123 (Pre-funded Rs. 15,000)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `balance`, `status`, `created_at`) 
VALUES ('usr_client', 'Test Client', 'user@backlink.com', '$2a$10$wO3t4i8QoH9H1a3d9z6v7.3aH9lP0s9O3lI6O3uI5Oa8qS.u7W1eS', '+923219876543', 'user', 15000.00, 'active', NOW());

-- Seed Settings
INSERT INTO `settings` (`id`, `website_name`, `logo`, `currency`, `deposit_instructions`, `contact_email`, `smtp_email`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`)
VALUES (1, 'SEO Backlink Hub', '🔗 BacklinkHub', 'PKR', 
'Please send the amount to Easypaisa / JazzCash / Bank Account:\n\n- Easypaisa: 0300-1234567 (Title: SEO Hub Admin)\n- Bank Account: Allied Bank 0123456789 (Title: SEO Backlink Platform)\n\nAfter sending, input the Transaction ID, Deposit Amount, and Payment Method below.',
'support@backlinkhub.com', 'smtp-admin@backlinkhub.com', 'smtp.mailtrap.io', 2525, 'your-username', 'your-password');
