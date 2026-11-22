const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Tất cả các route quản lý người dùng đều yêu cầu đăng nhập và quyền ADMIN
router.use(authenticateToken);
router.use(requireAdmin);

// Lấy danh sách tất cả người dùng
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.email, u.phone, u.role, u.status, u.is_first_login,
           u.created_at, u.updated_at,
           d.id as department_id, d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY u.id ASC
  `).all();

  res.json(users.map(u => ({ ...u, is_first_login: Boolean(u.is_first_login) })));
});

// Admin cấp tài khoản mới
router.post('/', (req, res) => {
  const { username, full_name, email, phone, department_id, role, temporary_password } = req.body;

  if (!username || !full_name || !role || !temporary_password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ: Tên đăng nhập, Họ tên, Vai trò và Mật khẩu khởi tạo' });
  }

  // Check username uniqueness
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại trong hệ thống' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(temporary_password, salt);

  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, email, phone, department_id, role, status, is_first_login, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?)
  `);

  const info = insert.run(
    username.trim(),
    passwordHash,
    full_name.trim(),
    email ? email.trim() : null,
    phone ? phone.trim() : null,
    department_id || null,
    role,
    req.user.id
  );

  const newUserId = info.lastInsertRowid;

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'CREATE_USER',
    entityType: 'USER',
    entityId: newUserId,
    details: {
      message: `Admin cấp mới tài khoản: ${username} (${full_name})`,
      role,
      department_id
    },
    req
  });

  res.status(201).json({
    message: 'Cấp tài khoản mới thành công! Người dùng sẽ cần đổi mật khẩu ở lần đăng nhập đầu tiên.',
    user_id: newUserId
  });
});

// Chỉnh sửa thông tin người dùng
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, department_id, role } = req.body;

  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Người dùng không tồn tại' });
  }

  db.prepare(`
    UPDATE users
    SET full_name = ?, email = ?, phone = ?, department_id = ?, role = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    full_name || current.full_name,
    email !== undefined ? email : current.email,
    phone !== undefined ? phone : current.phone,
    department_id !== undefined ? department_id : current.department_id,
    role || current.role,
    id
  );

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'UPDATE_USER',
    entityType: 'USER',
    entityId: id,
    details: {
      before: { full_name: current.full_name, role: current.role, department_id: current.department_id },
      after: { full_name, role, department_id }
    },
    req
  });

  res.json({ message: 'Cập nhật thông tin người dùng thành công' });
});

// Khóa hoặc Mở khóa tài khoản
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ error: 'Không thể tự khóa tài khoản của chính mình' });
  }

  if (!['ACTIVE', 'LOCKED'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ (phải là ACTIVE hoặc LOCKED)' });
  }

  const current = db.prepare('SELECT id, username, status FROM users WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Người dùng không tồn tại' });
  }

  db.prepare("UPDATE users SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(status, id);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: status === 'LOCKED' ? 'LOCK_USER' : 'UNLOCK_USER',
    entityType: 'USER',
    entityId: id,
    details: `Admin đã ${status === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản [${current.username}]`,
    req
  });

  res.json({ message: `Đã ${status === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản thành công` });
});

// Đặt lại mật khẩu (Reset password)
router.post('/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
  }

  const current = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Người dùng không tồn tại' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(new_password, salt);

  db.prepare(`
    UPDATE users
    SET password_hash = ?, is_first_login = 1, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(passwordHash, id);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'RESET_PASSWORD',
    entityType: 'USER',
    entityId: id,
    details: `Admin đã reset mật khẩu tài khoản [${current.username}] và yêu cầu đổi lại ở lần đăng nhập tới`,
    req
  });

  res.json({ message: 'Đặt lại mật khẩu thành công. Người dùng sẽ đổi lại mật khẩu khi đăng nhập.' });
});

// Xóa tài khoản
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ error: 'Không thể xóa tài khoản hiện đang đăng nhập' });
  }

  const current = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Người dùng không tồn tại' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'DELETE_USER',
    entityType: 'USER',
    entityId: id,
    details: `Admin đã xóa tài khoản [${current.username}] khỏi hệ thống`,
    req
  });

  res.json({ message: 'Đã xóa tài khoản thành công' });
});

module.exports = router;
