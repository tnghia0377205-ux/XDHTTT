const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'qnu_docflow_jwt_secret_key_2026_super_secure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập để truy cập hệ thống' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên làm việc đã hết hạn hoặc không hợp lệ' });
    }

    // Verify user in db
    const row = db.prepare('SELECT id, username, full_name, role, status, is_first_login, department_id FROM users WHERE id = ?').get(user.id);
    if (!row) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    if (row.status === 'LOCKED') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
    }

    req.user = row;
    next();
  });
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện chức năng này' });
    }
    next();
  };
}

const requireAdmin = requireRoles('ADMIN');

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRoles,
  requireAdmin
};
