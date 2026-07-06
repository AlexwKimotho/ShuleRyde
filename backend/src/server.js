const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// Note: compression@1.x is not compatible with Express 5 — omitted intentionally
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust Render's load balancer so req.ip is the client IP, not the proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many attempts, please try again later.', standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
