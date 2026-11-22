require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');

// Initialize database schema and seeds
require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const documentRoutes = require('./routes/documents');
const auditRoutes = require('./routes/audit');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'QNU DocFlow - Trường Đại học Quy Nhơn',
    timestamp: new Date().toISOString(),
    database: 'SQLite 3 (Built-in Node 24 Enterprise)'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại!' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 QNU DocFlow Backend API đang chạy tại: http://localhost:${PORT}`);
  console.log(`📌 Frontend kết nối tại: http://localhost:5173`);
  console.log(`=======================================================`);
});
