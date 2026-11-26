const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Đăng nhập hệ thống (Chỉ tài khoản đã được Admin cấp)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
  }

  const user = db.prepare(`
    SELECT u.*, d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.username = ?
  `).get(username.trim());

  if (!user) {
    logAudit({
      username: username.trim(),
      action: 'LOGIN_FAILED',
      entityType: 'AUTH',
      entityId: null,
      details: 'Đăng nhập thất bại: Tài khoản không tồn tại trên hệ thống',
      req
    });
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  if (user.status === 'LOCKED') {
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'LOGIN_BLOCKED',
      entityType: 'AUTH',
      entityId: user.id,
      details: 'Đăng nhập thất bại: Tài khoản đang bị khóa',
      req
    });
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'LOGIN_FAILED',
      entityType: 'AUTH',
      entityId: user.id,
      details: 'Đăng nhập thất bại: Mật khẩu không chính xác',
      req
    });
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  // Create JWT Token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Log successful login
  logAudit({
    userId: user.id,
    username: user.username,
    action: 'LOGIN_SUCCESS',
    entityType: 'AUTH',
    entityId: user.id,
    details: `Đăng nhập thành công với tài khoản (${user.username})`,
    req
  });

  res.json({
    message: 'Đăng nhập thành công',
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department_id: user.department_id,
      department_name: user.department_name,
      department_code: user.department_code,
      is_first_login: Boolean(user.is_first_login)
    }
  });
});

// Đổi mật khẩu (Bắt buộc lần đầu hoặc người dùng tự đổi)
router.post('/change-password', authenticateToken, (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const userId = req.user.id;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
  }

  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
  }

  const isMatch = bcrypt.compareSync(current_password, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(new_password, salt);

  db.prepare(`
    UPDATE users
    SET password_hash = ?, is_first_login = 0, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(newHash, userId);

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'CHANGE_PASSWORD',
    entityType: 'USER',
    entityId: user.id,
    details: 'Người dùng đã thay đổi mật khẩu thành công',
    req
  });

  res.json({ message: 'Đổi mật khẩu thành công. Mật khẩu mới đã được áp dụng!' });
});

// Lấy thông tin tài khoản hiện tại
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.email, u.phone, u.role, u.status, u.is_first_login,
           d.id as department_id, d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Người dùng không tồn tại' });
  }

  res.json({
    ...user,
    is_first_login: Boolean(user.is_first_login)
  });
});

module.exports = router;
