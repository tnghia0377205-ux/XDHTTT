const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Chỉ ADMIN mới có quyền truy cập nhật ký thao tác
router.use(authenticateToken);
router.use(requireAdmin);

// Lấy danh sách lịch sử thao tác với bộ lọc
router.get('/', (req, res) => {
  const { search, action, user_id, entity_type, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (username LIKE ? OR details LIKE ? OR entity_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (entity_type) {
    query += ' AND entity_type = ?';
    params.push(entity_type);
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const logs = db.prepare(query).all(...params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const countParams = [];
  if (search) {
    countQuery += ' AND (username LIKE ? OR details LIKE ? OR entity_id LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (action) {
    countQuery += ' AND action = ?';
    countParams.push(action);
  }
  if (user_id) {
    countQuery += ' AND user_id = ?';
    countParams.push(user_id);
  }
  if (entity_type) {
    countQuery += ' AND entity_type = ?';
    countParams.push(entity_type);
  }

  const total = db.prepare(countQuery).get(...countParams).total;

  res.json({
    total,
    items: logs
  });
});

module.exports = router;
