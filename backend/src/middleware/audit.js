const db = require('../db');

function logAudit({ userId, username, action, entityType, entityId, details, req }) {
  try {
    let ip = '127.0.0.1';
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    }

    const detailString = typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details || '');

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId || null, username || 'GUEST', action, entityType, String(entityId || ''), detailString, ip);
  } catch (err) {
    console.error('Lỗi ghi Audit Log:', err);
  }
}

module.exports = { logAudit };
