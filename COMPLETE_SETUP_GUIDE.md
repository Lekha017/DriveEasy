# 🚗 DriveEasy - Complete Setup Guide for Windows

## 📋 Table of Contents
1. [Install Prerequisites](#step-1-install-prerequisites)
2. [Setup Database](#step-2-setup-database)
3. [Install Backend Dependencies](#step-3-install-backend-dependencies)
4. [Start Backend Server](#step-4-start-backend-server)
5. [Start Frontend](#step-5-start-frontend)
6. [Open in Browser](#step-6-open-in-browser)
7. [Default Login Credentials](#default-login-credentials)
8. [Troubleshooting](#troubleshooting)

---

## **Step 1: Install Prerequisites**

### **1.1 Install Node.js**
```
1. Go to https://nodejs.org/
2. Download "LTS" version (recommended for most users)
3. Run the installer (.msi file)
4. Click "Next" through all installation steps
5. Make sure "Add to PATH" is checked
6. Click "Install"
7. Restart your computer after installation
```

### **1.2 Install MySQL**
```
1. Go to https://dev.mysql.com/downloads/installer/
2. Download "Windows (x86, 32-bit), MSI Installer" - the larger file (~400MB)
3. Run the installer
4. Choose "Developer Default" setup type
5. Click "Next" and then "Execute" to download components
6. In MySQL Server Configuration:
   - Set root password as: pallavi
   - Remember this password!
7. Complete the installation
8. MySQL will start automatically
```

---

## **Step 2: Setup Database**

### **2.1 Open MySQL Command Line Client**
```
1. Press Windows Key
2. Search for "MySQL 8.0 Command Line Client"
3. Open it (black command window will appear)
4. Enter password: pallavi
5. Press Enter
```

### **2.2 Create Database and Tables**

**Copy and paste the following SQL commands into MySQL Command Line:**

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS driveeasy;
USE driveeasy;

-- Create Users Table
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

-- Create Instructors Table
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

-- Create Bookings Table
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

-- Create Notifications Table
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

-- Insert Sample Users (password for all: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'admin'),
('John Smith', 'john@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'instructor'),
('Sarah Johnson', 'sarah@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'instructor'),
('Mike Chen', 'mike@driveeasy.com', '$2b$10$8K1p/a0dL22N/Y0m1a2.qONc8M5LKOwx4E5Cw4Rr5rDGxL0LG6kV6', 'instructor');

-- Insert Sample Instructors
INSERT INTO instructors (user_id, name, email, license_id, experience, status) VALUES
(2, 'John Smith', 'john@driveeasy.com', 'LIC0002', '5 Years Experience - Two/Four Wheeler', 'available'),
(3, 'Sarah Johnson', 'sarah@driveeasy.com', 'LIC0003', '8 Years Experience - Four Wheeler Specialist', 'available'),
(4, 'Mike Chen', 'mike@driveeasy.com', 'LIC0004', '3 Years Experience - Two Wheeler Specialist', 'available');

-- Verify Setup
SELECT 'Database setup complete!' AS Status;
SHOW TABLES;
SELECT COUNT(*) AS 'Total Users' FROM users;
SELECT COUNT(*) AS 'Total Instructors' FROM instructors;
```

**After pasting, press Enter. You should see:**
```
Database setup complete!
+---------------+
| Tables        |
+---------------+
| bookings      |
| instructors   |
| notifications |
| users         |
+---------------+
```

---

## **Step 3: Install Backend Dependencies**

### **3.1 Open Command Prompt**
```
1. Press Windows Key + R
2. Type: cmd
3. Press Enter (black window opens)
```

### **3.2 Navigate to Backend Folder**

**Replace the path below with YOUR actual project path:**

```cmd
cd C:\Users\YourUsername\Desktop\DriveEasy2\driveeasy-backend
```

**Example paths:**
- `cd C:\Users\John\Documents\DriveEasy2\driveeasy-backend`
- `cd C:\Users\Sarah\Desktop\Projects\DriveEasy2\driveeasy-backend`

**Tip:** You can drag and drop the folder into cmd to get the path!

### **3.3 Install Node Packages**

```cmd
npm install
```

**This will install:**
- express
- mysql2
- bcrypt
- express-session
- cors
- express-rate-limit

**Wait 1-2 minutes for installation to complete.**

You should see:
```
added 57 packages, and audited 58 packages in 45s
```

---

## **Step 4: Start Backend Server**

**In the same Command Prompt window (still in driveeasy-backend folder):**

```cmd
npm start
```

**You should see this output:**
```
==================================================
🚗 DriveEasy Backend Server Started
==================================================
🚀 Server: http://localhost:5000
📊 Health: http://localhost:5000/health
📚 API Docs: http://localhost:5000/
🕐 Started: [current date/time]
==================================================

✅ Database connected successfully
✅ Database test query successful
```

**✅ If you see this, backend is running correctly!**

**⚠️ IMPORTANT: Keep this Command Prompt window open!**

---

## **Step 5: Start Frontend**

### **Option A: Using Python (Recommended)**

**5.1 Open a NEW Command Prompt (2nd window)**
```
1. Press Windows Key + R again
2. Type: cmd
3. Press Enter
```

**5.2 Navigate to Frontend Folder**

```cmd
cd C:\Users\YourUsername\Desktop\DriveEasy2\driveeasy-frontend
```

**5.3 Start Frontend Server**

```cmd
python -m http.server 5500
```

**If you get an error, try:**
```cmd
python3 -m http.server 5500
```

**You should see:**
```
Serving HTTP on :: port 5500 (http://[::]:5500/) ...
```

**✅ Frontend is now running!**

**⚠️ IMPORTANT: Keep this window open too!**

---

### **Option B: Using VS Code Live Server**

If you don't have Python:

```
1. Open Visual Studio Code
2. File → Open Folder → Select "driveeasy-frontend"
3. Click on "Home.html"
4. Right-click anywhere in the file
5. Select "Open with Live Server"
```

---

## **Step 6: Open in Browser**

**Open your favorite browser (Chrome, Firefox, Edge) and go to:**

```
http://localhost:5500/Home.html
```

**You should see the DriveEasy homepage! 🎉**

---

## 🎯 Default Login Credentials

### **Admin Account**
- **Email:** `admin@driveeasy.com`
- **Password:** `admin123`
- **Access:** Admin dashboard, manage all bookings, users, instructors

### **Instructor Accounts**
- **John Smith**
  - Email: `john@driveeasy.com`
  - Password: `instructor123`

- **Sarah Johnson**
  - Email: `sarah@driveeasy.com`
  - Password: `instructor123`

- **Mike Chen**
  - Email: `mike@driveeasy.com`
  - Password: `instructor123`

### **Or Create Your Own User Account!**
- Click "Register/Login"
- Click "Register"
- Fill in your details
- Select "Student" role
- Auto-login after registration

---

## 📝 Quick Command Summary

**For future use, just run these commands:**

### **Terminal 1 - Backend**
```cmd
cd C:\path\to\DriveEasy2\driveeasy-backend
npm start
```

### **Terminal 2 - Frontend**
```cmd
cd C:\path\to\DriveEasy2\driveeasy-frontend
python -m http.server 5500
```

### **Browser**
```
http://localhost:5500/Home.html
```

---

## ❌ Troubleshooting

### **Problem: "npm is not recognized"**
**Solution:**
```
1. Make sure Node.js is installed
2. Restart your computer
3. Open new Command Prompt
4. Try: node --version
5. If still not working, reinstall Node.js
```

### **Problem: "MySQL connection failed" or "ER_ACCESS_DENIED_ERROR"**
**Solution:**
```
1. Check MySQL is running (search "Services" → find "MySQL80" → should be "Running")
2. Verify password in server.js (line 16) is "pallavi"
3. Try logging into MySQL Command Line with password "pallavi"
4. If password is wrong, reset it:
   - Open MySQL Command Line as Administrator
   - ALTER USER 'root'@'localhost' IDENTIFIED BY 'pallavi';
```

### **Problem: "Port 5000 already in use" (Backend)**
**Solution:**
```
1. Close other applications using port 5000
2. Or change port in server.js (line 12):
   port: process.env.PORT || 5001
3. Restart backend
4. Update API URL in frontend files if needed
```

### **Problem: "Port 5500 already in use" (Frontend)**
**Solution:**
```
Use a different port:
python -m http.server 5501

Then open: http://localhost:5501/Home.html
```

### **Problem: "Cannot find module 'express'"**
**Solution:**
```cmd
cd driveeasy-backend
npm install
```

### **Problem: "python is not recognized"**
**Solution:**
```
Option 1: Install Python from python.org
Option 2: Use VS Code Live Server instead
Option 3: Use Node's http-server:
  npm install -g http-server
  cd driveeasy-frontend
  http-server -p 5500
```

### **Problem: Backend starts but frontend can't connect**
**Solution:**
```
1. Check both terminals are running
2. Verify backend shows "✅ Database connected"
3. Check browser console for errors (F12)
4. Make sure you're using http://localhost:5500/Home.html
5. Clear browser cache (Ctrl + Shift + Delete)
```

### **Problem: "Tables already exist" error in MySQL**
**Solution:**
```sql
-- Skip this error, tables are already created
-- Or if you want to start fresh:
DROP DATABASE driveeasy;
-- Then run the CREATE DATABASE commands again
```

### **Problem: Booking form shows 404 error**
**Solution:**
```
- Backend server must be running on port 5000
- Check terminal 1 shows "Server: http://localhost:5000"
- Test by opening: http://localhost:5000/health in browser
```

---

## ✅ Success Checklist

Before testing, make sure:

- [x] Node.js installed (check: `node --version`)
- [x] MySQL installed and running
- [x] Database "driveeasy" created
- [x] All 4 tables created (users, instructors, bookings, notifications)
- [x] Sample data inserted (3 instructors, 1 admin)
- [x] Backend dependencies installed (`npm install` completed)
- [x] Backend running (Terminal 1 shows ✅ messages)
- [x] Frontend server running (Terminal 2 or Live Server)
- [x] Browser opens http://localhost:5500/Home.html
- [x] No errors in browser console (F12 → Console tab)

---

## 🎯 Testing the Application

### **1. Test Registration**
```
1. Click "Register/Login" button
2. Click "Register"
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Role: Student (click the card)
4. Click "Create Account"
5. Should auto-login and redirect to dashboard
```

### **2. Test Booking**
```
1. Click "Book New Class" button
2. Fill in all fields:
   - Full Name
   - 10-digit phone number
   - Pickup address
   - Select a future date
   - Choose time slot (Morning/Evening)
   - Choose license type (Two Wheeler/Four Wheeler)
   - Optional: Select instructor
3. Click "Confirm Booking"
4. Should see success toast and redirect to dashboard
```

### **3. Test Admin Panel**
```
1. Logout (if logged in)
2. Login with:
   - Email: admin@driveeasy.com
   - Password: admin123
3. Should see admin dashboard
4. View pending bookings
5. Approve a booking:
   - Click "Approve" button
   - Select an instructor
   - Click "Approve & Notify"
6. User should receive notification
```

### **4. Test Instructor Dashboard**
```
1. Logout
2. Login with:
   - Email: john@driveeasy.com
   - Password: instructor123
3. Should see instructor dashboard
4. View assigned bookings (after admin approves)
```

---

## 🎨 Project Features

### **✨ Modern UI/UX**
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Toast notifications (no ugly alerts!)
- Progress bars on forms
- Interactive card selections
- Fully responsive design

### **🔐 Authentication**
- Secure login/registration
- Session-based authentication
- Password hashing with bcrypt
- Role-based access control
- Auto-login after registration

### **📊 Dashboards**
- **User Dashboard:** View bookings, statistics
- **Instructor Dashboard:** View assigned classes
- **Admin Dashboard:** Manage all bookings, users, instructors

### **📅 Booking System**
- 10-day driving course
- Morning/Evening time slots
- Two Wheeler/Four Wheeler options
- Instructor selection (optional)
- Admin approval workflow
- Real-time notifications

---

## 📁 Project Structure

```
DriveEasy2/
├── driveeasy-backend/
│   ├── server.js              # Main backend server
│   ├── package.json           # Dependencies
│   └── node_modules/          # Installed packages
│
├── driveeasy-frontend/
│   ├── Home.html              # Landing page (modern popups)
│   ├── book.html              # Booking form (modern design)
│   ├── userdashboard.html     # User dashboard (NEW!)
│   ├── instructordashboard.html # Instructor dashboard
│   ├── admin.html             # Admin panel
│   ├── instructor.html        # Instructor list
│   └── about.html             # About page
│
└── COMPLETE_SETUP_GUIDE.md    # This file!
```

---

## 🔄 Stopping the Application

### **To Stop Backend:**
```
Go to Terminal 1 (backend)
Press: Ctrl + C
Type: Y
Press Enter
```

### **To Stop Frontend:**
```
Go to Terminal 2 (frontend)
Press: Ctrl + C
Type: Y
Press Enter
```

### **MySQL keeps running in background (that's OK!)**

---

## 🚀 Restarting the Application

Next time you want to run the project:

**1. Open Terminal 1:**
```cmd
cd C:\path\to\DriveEasy2\driveeasy-backend
npm start
```

**2. Open Terminal 2:**
```cmd
cd C:\path\to\DriveEasy2\driveeasy-frontend
python -m http.server 5500
```

**3. Open Browser:**
```
http://localhost:5500/Home.html
```

**That's it!** No need to reinstall anything.

---

## 📞 Need Help?

If you encounter issues not covered here:

1. **Check both terminals are running**
2. **Read error messages carefully**
3. **Try the troubleshooting section**
4. **Clear browser cache and try again**
5. **Restart both backend and frontend**
6. **Restart MySQL service if connection fails**

---

## 🎉 Congratulations!

You've successfully set up DriveEasy!

**What you can do now:**
- ✅ Register users
- ✅ Book driving classes
- ✅ Admin can approve/reject bookings
- ✅ Instructors can view their schedule
- ✅ Modern UI with toast notifications
- ✅ Fully functional booking system

**Enjoy using DriveEasy! 🚗💨**

---

## 📝 Quick Reference

### **Important URLs**
- **Frontend:** http://localhost:5500/Home.html
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **API Docs:** http://localhost:5000

### **Important Files to Edit**
- **Backend Config:** `driveeasy-backend/server.js` (line 12-35)
- **API URL in Frontend:** Search for `http://localhost:5000` in HTML files

### **Database Info**
- **Database Name:** driveeasy
- **Username:** root
- **Password:** pallavi
- **Port:** 3306 (default)

---

**Last Updated:** 2025
**Version:** 2.0 (Modern UI Update)
