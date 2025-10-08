const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust proxy - Required for Railway/production deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ==================== CONFIGURATION ====================
const config = {
  port: process.env.PORT || 5000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'pallavi',
    database: process.env.DB_NAME || 'driveeasy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  session: {
    secret: process.env.SESSION_SECRET || 'driveeasy-secret-key-2025-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
    },
    name: 'driveeasy.sid'
  },
  bcryptRounds: 10
};

// ==================== RATE LIMITING ====================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  skip: (req) => {
    // Skip rate limiting for auth-related routes
    return req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/check-session');
  }
});

// ==================== MIDDLEWARE ====================
// IMPORTANT: Order matters! CORS must be first, then session, then rate limiting

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:5501',
      'http://localhost:5501',
      'http://127.0.0.1:5502',
      'http://localhost:5502'
    ];

    // Add production frontend URL from environment variable
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️  Origin not in whitelist:', origin);
      callback(null, true); // Allow anyway for development
    }
  },
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

app.use(express.json());

// Session middleware MUST come before rate limiting
app.use(session(config.session));

// Apply rate limiting after session
app.use(generalLimiter);

// Request logging middleware with session info
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const sessionInfo = req.session.userId ? `[User: ${req.session.userId}]` : '[Anonymous]';
  console.log(`[${timestamp}] ${req.method} ${req.path} ${sessionInfo}`);
  next();
});

// ==================== DATABASE CONNECTION ====================
const pool = mysql.createPool(config.db);

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    await connection.query('SELECT 1');
    console.log('✅ Database test query successful');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check:');
    console.error('1. MySQL is running');
    console.error('2. Database "driveeasy" exists');
    console.error('3. Credentials are correct');
    process.exit(1);
  }
})();

// ==================== HELPER MIDDLEWARE ====================
const isAuthenticated = (req, res, next) => {
  console.log('🔐 Auth check - Session ID:', req.sessionID);
  console.log('🔐 Auth check - User ID:', req.session.userId);
  console.log('🔐 Auth check - Session:', req.session);

  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      error: 'Admin access required',
      message: 'You do not have permission to access this resource'
    });
  }
};

const isInstructor = (req, res, next) => {
  if (req.session.role === 'instructor') {
    next();
  } else {
    res.status(403).json({
      error: 'Instructor access required',
      message: 'You do not have permission to access this resource'
    });
  }
};

// ==================== VALIDATION HELPERS ====================
const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  password: (password) => password && password.length >= 6,
  name: (name) => name && name.trim().length >= 2,
  contact: (contact) => /^\d{10}$/.test(contact),
  date: (date) => {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }
};

// ==================== ROOT ROUTES ====================
app.get('/', (req, res) => {
  res.json({
    message: '🚗 DriveEasy Backend API',
    version: '2.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    session: {
      authenticated: !!req.session.userId,
      sessionID: req.sessionID
    },
    endpoints: {
      auth: [
        'POST /register - Register new user',
        'POST /login - User login',
        'POST /logout - User logout',
        'GET /check-session - Check authentication status'
      ],
      instructors: [
        'GET /instructors - Get all instructors',
        'GET /instructors/:id - Get single instructor'
      ],
      bookings: [
        'POST /book - Create booking (authenticated)',
        'GET /my-bookings - Get user bookings (authenticated)'
      ],
      notifications: [
        'GET /notifications - Get user notifications (authenticated)',
        'PUT /notifications/:id/read - Mark notification as read',
        'PUT /notifications/read-all - Mark all as read'
      ],
      admin: [
        'GET /admin/bookings - Get all bookings (admin only)',
        'PUT /admin/bookings/:id - Update booking (admin only)',
        'GET /users - Get all users (admin only)',
        'GET /stats - Get statistics (authenticated)'
      ]
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      server: 'DriveEasy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!validators.name(name)) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!validators.email(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validators.password(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const validRoles = ['user', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );

    if (role === 'instructor') {
      await pool.query(
        'INSERT INTO instructors (user_id, name, email, license_id, experience, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          result.insertId,
          name.trim(),
          email.toLowerCase().trim(),
          `LIC${String(result.insertId).padStart(4, '0')}`,
          'New Instructor',
          'available'
        ]
      );
    }

    console.log(`✅ New ${role} registered: ${email}`);
    res.json({
      message: 'Registration successful! Please login.',
      userId: result.insertId
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validators.email(email) || !password) {
      return res.status(400).json({ error: 'Please provide valid email and password' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Regenerate session to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.name = user.name;
      req.session.email = user.email;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Login failed. Please try again.' });
        }

        console.log(`✅ User logged in: ${email} (${user.role}) - Session: ${req.sessionID}`);

        res.json({
          message: 'Login successful',
          role: user.role,
          name: user.name,
          email: user.email,
          userId: user.id
        });
      });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.post('/logout', (req, res) => {
  const userEmail = req.session.email;

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    console.log(`✅ User logged out: ${userEmail}`);
    res.clearCookie('driveeasy.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/check-session', (req, res) => {
  console.log('📋 Session check - ID:', req.sessionID);
  console.log('📋 Session check - Data:', req.session);

  if (req.session.userId) {
    res.json({
      loggedIn: true,
      userId: req.session.userId,
      role: req.session.role,
      name: req.session.name,
      email: req.session.email
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// ==================== INSTRUCTOR ROUTES ====================
app.get('/instructors', async (req, res) => {
  try {
    const [instructors] = await pool.query(
      'SELECT id, name, email, license_id, experience, status, image_url FROM instructors ORDER BY name ASC'
    );

    console.log(`✅ Fetched ${instructors.length} instructors`);
    res.json(instructors);

  } catch (err) {
    console.error('Error fetching instructors:', err);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
});

app.get('/instructors/:id', async (req, res) => {
  try {
    const [instructors] = await pool.query(
      'SELECT id, name, email, license_id, experience, status, image_url FROM instructors WHERE id = ?',
      [req.params.id]
    );

    if (instructors.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    res.json(instructors[0]);

  } catch (err) {
    console.error('Error fetching instructor:', err);
    res.status(500).json({ error: 'Failed to fetch instructor' });
  }
});

// ==================== BOOKING ROUTES ====================
app.post('/bookings', isAuthenticated, async (req, res) => {
  try {
    const { studentName, phone, address, startDate, timeSlot, licenseType, instructorId } = req.body;
    const userId = req.session.userId;

    if (!validators.name(studentName)) {
      return res.status(400).json({ error: 'Please provide a valid name' });
    }

    if (!validators.contact(phone)) {
      return res.status(400).json({ error: 'Contact number must be exactly 10 digits' });
    }

    if (!timeSlot) {
      return res.status(400).json({ error: 'Please select a valid time slot' });
    }

    if (!validators.date(startDate)) {
      return res.status(400).json({ error: 'Please select a valid future date' });
    }

    const [existingBookings] = await pool.query(
      'SELECT id FROM bookings WHERE user_id = ? AND status IN ("pending", "approved")',
      [userId]
    );

    if (existingBookings.length > 0) {
      return res.status(400).json({
        error: 'You already have an active booking. Please wait for it to be processed or contact admin.'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO bookings (user_id, user_name, contact, address, time_slot, date, license_type, instructor_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, studentName.trim(), phone, address.trim(), timeSlot, startDate, licenseType, instructorId || null, 'pending']
    );

    let notificationMessage = `Your booking for ${startDate} (${timeSlot}) has been submitted and is pending admin approval.`;

    if (instructorId) {
      const [instructors] = await pool.query('SELECT name FROM instructors WHERE id = ?', [instructorId]);
      if (instructors.length > 0) {
        notificationMessage += ` Requested instructor: ${instructors[0].name}.`;
      }
    } else {
      notificationMessage += ' An instructor will be assigned after approval.';
    }

    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [userId, notificationMessage, 'booking']
    );

    console.log(`✅ New booking created: ID ${result.insertId} by user ${userId}`);

    res.json({
      message: 'Booking submitted successfully! Admin will review and approve shortly.',
      bookingId: result.insertId
    });

  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed. Please try again.' });
  }
});

app.get('/my-bookings', isAuthenticated, async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT 
        b.*,
        i.name as instructor_name,
        i.email as instructor_email,
        i.license_id as instructor_license
      FROM bookings b
      LEFT JOIN instructors i ON b.instructor_id = i.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.session.userId]);

    res.json(bookings);

  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ==================== INSTRUCTOR ROUTES ====================
app.get('/instructor/bookings', isAuthenticated, isInstructor, async (req, res) => {
  try {
    // Get instructor ID from user session
    const [instructors] = await pool.query(
      'SELECT id FROM instructors WHERE user_id = ?',
      [req.session.userId]
    );

    if (instructors.length === 0) {
      return res.status(404).json({ error: 'Instructor profile not found' });
    }

    const instructorId = instructors[0].id;

    const [bookings] = await pool.query(`
      SELECT
        b.*,
        u.name as user_name,
        u.email as user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.instructor_id = ? AND b.status = 'approved'
      ORDER BY b.date ASC, b.time_slot ASC
    `, [instructorId]);

    res.json(bookings);

  } catch (err) {
    console.error('Error fetching instructor bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ==================== NOTIFICATION ROUTES ====================
app.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.session.userId]
    );

    res.json(notifications);

  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/notifications/:id/read', isAuthenticated, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    res.json({ message: 'Notification marked as read' });

  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.put('/notifications/read-all', isAuthenticated, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.session.userId]
    );

    res.json({ message: 'All notifications marked as read' });

  } catch (err) {
    console.error('Error updating notifications:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// ==================== ADMIN ROUTES ====================
app.get('/admin/bookings', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT 
        b.*,
        u.email as user_email,
        i.name as instructor_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN instructors i ON b.instructor_id = i.id
      ORDER BY 
        CASE b.status
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
        END,
        b.created_at DESC
    `);

    res.json(bookings);

  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.put('/admin/bookings/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, instructor_id } = req.body;
    const bookingId = req.params.id;

    const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'approved' && !instructor_id) {
      return res.status(400).json({ error: 'Instructor must be assigned when approving' });
    }

    await pool.query(
      'UPDATE bookings SET status = ?, instructor_id = ? WHERE id = ?',
      [status, instructor_id || booking.instructor_id, bookingId]
    );

    let instructorName = 'Instructor';
    if (instructor_id) {
      const [instructors] = await pool.query('SELECT name FROM instructors WHERE id = ?', [instructor_id]);
      if (instructors.length > 0) {
        instructorName = instructors[0].name;
        await pool.query('UPDATE instructors SET status = ? WHERE id = ?', ['busy', instructor_id]);
      }
    }

    let message = '';
    if (status === 'approved') {
      message = `✅ Great news! Your booking for ${booking.date} (${booking.time_slot}) has been APPROVED!\n\nInstructor: ${instructorName}\nDate: ${booking.date}\nTime: ${booking.time_slot}\n\nPlease arrive 10 minutes early. Happy learning!`;
    } else if (status === 'rejected') {
      message = `❌ Sorry, your booking for ${booking.date} (${booking.time_slot}) could not be approved. Please try booking a different time slot or contact us for assistance.`;
    }

    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [booking.user_id, message, 'booking_update']
    );

    console.log(`✅ Booking ${bookingId} ${status} by admin ${req.session.email}`);

    res.json({
      message: `Booking ${status} successfully and user has been notified`,
      bookingId: bookingId
    });

  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(users);

  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [bookingCount] = await pool.query('SELECT COUNT(*) as count FROM bookings');
    const [pendingCount] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE status = "pending"');
    const [approvedCount] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE status = "approved"');

    res.json({
      activeLearners: userCount[0].count,
      classesBooked: bookingCount[0].count,
      pendingBookings: pendingCount[0].count,
      approvedBookings: approvedCount[0].count
    });

  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

// ==================== START SERVER ====================
app.listen(config.port, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚗 DriveEasy Backend Server Started');
  console.log('='.repeat(50));
  console.log(`🚀 Server: http://localhost:${config.port}`);
  console.log(`📊 Health: http://localhost:${config.port}/health`);
  console.log(`📚 API Docs: http://localhost:${config.port}/`);
  console.log(`🕐 Started: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50) + '\n');
});