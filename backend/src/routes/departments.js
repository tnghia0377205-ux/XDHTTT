const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);

// Lấy danh sách tất cả phòng ban, đơn vị
router.get('/', (req, res) => {
  const departments = db.prepare(`
    SELECT d.*,
           (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) as user_count,
           (SELECT COUNT(*) FROM documents doc WHERE doc.receiving_unit_id = d.id) as doc_count
    FROM departments d
    ORDER BY d.id ASC
  `).all();

  res.json(departments);
});

// Thêm mới đơn vị (Admin hoặc Văn thư)
router.post('/', requireRoles('ADMIN', 'VAN_THU'), (req, res) => {
  const { code, name, phone, email } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: 'Mã đơn vị và Tên đơn vị là bắt buộc' });
  }

  const existing = db.prepare('SELECT id FROM departments WHERE code = ?').get(code.trim().toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'Mã đơn vị này đã tồn tại' });
  }

  const insert = db.prepare('INSERT INTO departments (code, name, phone, email) VALUES (?, ?, ?, ?)');
  const info = insert.run(code.trim().toUpperCase(), name.trim(), phone || null, email || null);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'CREATE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: info.lastInsertRowid,
    details: `Tạo mới đơn vị: ${code} - ${name}`,
    req
  });

  res.status(201).json({ message: 'Tạo đơn vị mới thành công', id: info.lastInsertRowid });
});

// Cập nhật đơn vị
router.put('/:id', requireRoles('ADMIN', 'VAN_THU'), (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;

  const current = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Đơn vị không tồn tại' });
  }

  db.prepare('UPDATE departments SET name = ?, phone = ?, email = ? WHERE id = ?').run(
    name || current.name,
    phone !== undefined ? phone : current.phone,
    email !== undefined ? email : current.email,
    id
  );

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'UPDATE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: id,
    details: `Cập nhật thông tin đơn vị [${current.code}]`,
    req
  });

  res.json({ message: 'Cập nhật đơn vị thành công' });
});

// Xóa đơn vị
router.delete('/:id', requireRoles('ADMIN'), (req, res) => {
  const { id } = req.params;

  const current = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!current) {
    return res.status(404).json({ error: 'Đơn vị không tồn tại' });
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(id);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'DELETE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: id,
    details: `Xóa đơn vị [${current.code} - ${current.name}]`,
    req
  });

  res.json({ message: 'Đã xóa đơn vị thành công' });
});

module.exports = router;
