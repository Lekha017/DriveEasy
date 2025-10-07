-- DriveEasy Database Setup
-- Run this file: mysql -u root -p < setup-database.sql

CREATE DATABASE IF NOT EXISTS driveeasy;
USE driveeasy;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'instructor', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  license_id VARCHAR(50) NOT NULL UNIQUE,
  experience VARCHAR(255),
  status ENUM('available', 'busy') DEFAULT 'available',
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  contact VARCHAR(15) NOT NULL,
  address VARCHAR(500),
  time_slot VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  license_type VARCHAR(50),
  instructor_id INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_instructor_id (instructor_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'admin');

-- Insert sample instructors (password: instructor123)
INSERT INTO users (name, email, password, role) VALUES
('John Smith', 'john@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'instructor'),
('Sarah Johnson', 'sarah@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'instructor'),
('Mike Chen', 'mike@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'instructor');

-- Insert instructor profiles
INSERT INTO instructors (user_id, name, email, license_id, experience, status) VALUES
(2, 'John Smith', 'john@driveeasy.com', 'LIC0002', '5 Years Experience - Two/Four Wheeler', 'available'),
(3, 'Sarah Johnson', 'sarah@driveeasy.com', 'LIC0003', '8 Years Experience - Four Wheeler Specialist', 'available'),
(4, 'Mike Chen', 'mike@driveeasy.com', 'LIC0004', '3 Years Experience - Two Wheeler Specialist', 'available');

-- Show success message
SELECT '✅ Database setup complete!' AS Status;
SELECT 'Tables created:' AS Info;
SHOW TABLES;
SELECT 'Admin user created: admin@driveeasy.com / admin123' AS Credentials;
SELECT 'Sample instructors created (3)' AS Info;
