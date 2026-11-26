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

// Middleware tự động lọc data và loại bỏ ký tự thừa (Auto-Sanitize & Trim)
function sanitizeData(data) {
  if (typeof data === 'string') {
    return data
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // loại bỏ ký tự điều khiển ẩn, zero-width
      .replace(/\s+/g, ' ')                  // chuẩn hóa khoảng trắng thừa
      .trim();                               // xóa khoảng trắng đầu và cuối
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (data !== null && typeof data === 'object') {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = sanitizeData(data[key]);
    }
    return cleaned;
  }
  return data;
}

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeData(req.body);
  if (req.query) req.query = sanitizeData(req.query);
  next();
});

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
    system: 'Công văn số QNU - Trường Đại học Quy Nhơn',
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
  console.log(`🚀 Công văn số QNU Backend API đang chạy tại: http://localhost:${PORT}`);
  console.log(`📌 Frontend kết nối tại: http://localhost:5173`);
  console.log(`=======================================================`);
});
