const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Thống kê tổng quan cho Dashboard
router.get('/overview', (req, res) => {
  const incomingCount = db.prepare("SELECT COUNT(*) as count FROM documents WHERE doc_type = 'INCOMING'").get().count;
  const outgoingCount = db.prepare("SELECT COUNT(*) as count FROM documents WHERE doc_type = 'OUTGOING'").get().count;
  const processingCount = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'DANG_XU_LY'").get().count;
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'DA_HOAN_THANH'").get().count;

  // Thống kê theo độ khẩn
  const urgencyStats = db.prepare(`
    SELECT urgency_level, COUNT(*) as count
    FROM documents
    GROUP BY urgency_level
  `).all();

  // 5 công văn mới nhất
  const recentDocuments = db.prepare(`
    SELECT doc.id, doc.doc_type, doc.doc_number, doc.title, doc.issued_date, doc.status, doc.urgency_level,
           d.name as receiving_unit_name
    FROM documents doc
    LEFT JOIN departments d ON doc.receiving_unit_id = d.id
    ORDER BY doc.id DESC
    LIMIT 5
  `).all();

  // 5 lịch sử thao tác gần nhất (nếu là admin)
  let recentLogs = [];
  if (req.user.role === 'ADMIN') {
    recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5').all();
  }

  res.json({
    incoming_count: incomingCount,
    outgoing_count: outgoingCount,
    processing_count: processingCount,
    completed_count: completedCount,
    urgency_stats: urgencyStats,
    recent_documents: recentDocuments,
    recent_logs: recentLogs
  });
});

module.exports = router;
