const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const db = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Configure file upload storage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

router.use(authenticateToken);

// 1. Lấy danh sách công văn (có phân trang & bộ lọc)
router.get('/', (req, res) => {
  const { doc_type, status, search, urgency_level, receiving_unit_id, year } = req.query;

  let query = `
    SELECT doc.*,
           d.name as receiving_unit_name, d.code as receiving_unit_code,
           u.full_name as creator_name,
           (SELECT COUNT(*) FROM document_attachments att WHERE att.document_id = doc.id) as attachment_count,
           (SELECT progress_status FROM document_processing p WHERE p.document_id = doc.id ORDER BY p.id DESC LIMIT 1) as latest_processing_status
    FROM documents doc
    LEFT JOIN departments d ON doc.receiving_unit_id = d.id
    LEFT JOIN users u ON doc.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (doc_type) {
    query += ' AND doc.doc_type = ?';
    params.push(doc_type);
  }

  if (status) {
    query += ' AND doc.status = ?';
    params.push(status);
  }

  if (urgency_level) {
    query += ' AND doc.urgency_level = ?';
    params.push(urgency_level);
  }

  if (receiving_unit_id) {
    query += ' AND doc.receiving_unit_id = ?';
    params.push(receiving_unit_id);
  }

  if (year) {
    query += " AND strftime('%Y', doc.issued_date) = ?";
    params.push(year);
  }

  if (search) {
    query += ' AND (doc.doc_number LIKE ? OR doc.title LIKE ? OR doc.signer LIKE ? OR doc.issuing_unit LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY doc.issued_date DESC, doc.id DESC';

  const documents = db.prepare(query).all(...params);
  res.json(documents);
});

// 2. Lấy chi tiết một công văn (kèm tệp đính kèm và lịch sử xử lý)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const doc = db.prepare(`
    SELECT doc.*,
           d.name as receiving_unit_name, d.code as receiving_unit_code,
           u.full_name as creator_name
    FROM documents doc
    LEFT JOIN departments d ON doc.receiving_unit_id = d.id
    LEFT JOIN users u ON doc.created_by = u.id
    WHERE doc.id = ?
  `).get(id);

  if (!doc) {
    return res.status(404).json({ error: 'Không tìm thấy công văn' });
  }

  const attachments = db.prepare('SELECT * FROM document_attachments WHERE document_id = ?').all(id);
  const processing = db.prepare(`
    SELECT p.*,
           from_user.full_name as assigned_from_name,
           to_user.full_name as assigned_to_name
    FROM document_processing p
    LEFT JOIN users from_user ON p.assigned_from_id = from_user.id
    LEFT JOIN users to_user ON p.assigned_to_id = to_user.id
    WHERE p.document_id = ?
    ORDER BY p.id ASC
  `).all(id);

  res.json({
    ...doc,
    attachments,
    processing
  });
});

// 3. Tiếp nhận hoặc tạo mới công văn (kèm upload file)
router.post('/', upload.array('files', 5), (req, res) => {
  const {
    doc_type,
    doc_number,
    issued_date,
    received_date,
    title,
    signer,
    issuing_unit,
    receiving_unit_id,
    urgency_level = 'THUONG',
    security_level = 'BINH_THUONG',
    status = 'CHO_TIEP_NHAN',
    notes
  } = req.body;

  if (!doc_type || !doc_number || !issued_date || !title || !issuing_unit) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin: Loại, Số hiệu, Ngày ban hành, Trích yếu và Đơn vị ban hành' });
  }

  const insertDoc = db.prepare(`
    INSERT INTO documents (
      doc_type, doc_number, issued_date, received_date, title, signer,
      issuing_unit, receiving_unit_id, urgency_level, security_level, status, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertDoc.run(
    doc_type,
    doc_number.trim(),
    issued_date,
    received_date || null,
    title.trim(),
    signer ? signer.trim() : null,
    issuing_unit.trim(),
    receiving_unit_id ? Number(receiving_unit_id) : null,
    urgency_level,
    security_level,
    status,
    notes || null,
    req.user.id
  );

  const newDocId = info.lastInsertRowid;

  // Save attachments
  if (req.files && req.files.length > 0) {
    const insertAtt = db.prepare(`
      INSERT INTO document_attachments (document_id, original_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const file of req.files) {
      insertAtt.run(newDocId, file.originalname, file.filename, file.size, file.mimetype);
    }
  }

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: doc_type === 'INCOMING' ? 'CREATE_INCOMING_DOC' : 'CREATE_OUTGOING_DOC',
    entityType: 'DOCUMENT',
    entityId: newDocId,
    details: {
      doc_type,
      doc_number,
      title,
      issuing_unit,
      file_count: req.files ? req.files.length : 0
    },
    req
  });

  res.status(201).json({ message: 'Tạo công văn thành công', id: newDocId });
});

// 4. Cập nhật thông tin công văn
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!current) {
    return res.status(404).json({ error: 'Không tìm thấy công văn' });
  }

  const {
    doc_number,
    issued_date,
    received_date,
    title,
    signer,
    issuing_unit,
    receiving_unit_id,
    urgency_level,
    security_level,
    status,
    notes
  } = req.body;

  db.prepare(`
    UPDATE documents
    SET doc_number = ?, issued_date = ?, received_date = ?, title = ?, signer = ?,
        issuing_unit = ?, receiving_unit_id = ?, urgency_level = ?, security_level = ?,
        status = ?, notes = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    doc_number || current.doc_number,
    issued_date || current.issued_date,
    received_date !== undefined ? received_date : current.received_date,
    title || current.title,
    signer !== undefined ? signer : current.signer,
    issuing_unit || current.issuing_unit,
    receiving_unit_id !== undefined ? receiving_unit_id : current.receiving_unit_id,
    urgency_level || current.urgency_level,
    security_level || current.security_level,
    status || current.status,
    notes !== undefined ? notes : current.notes,
    id
  );

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'UPDATE_DOCUMENT',
    entityType: 'DOCUMENT',
    entityId: id,
    details: `Cập nhật thông tin công văn [${doc_number || current.doc_number}]`,
    req
  });

  res.json({ message: 'Cập nhật công văn thành công' });
});

// 5. Xóa công văn
router.delete('/:id', requireRoles('ADMIN', 'VAN_THU'), (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!current) {
    return res.status(404).json({ error: 'Không tìm thấy công văn' });
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'DELETE_DOCUMENT',
    entityType: 'DOCUMENT',
    entityId: id,
    details: `Xóa công văn [${current.doc_number}]: ${current.title}`,
    req
  });

  res.json({ message: 'Đã xóa công văn thành công' });
});

// 6. Phân công xử lý công văn (Giao việc)
router.post('/:id/assign', (req, res) => {
  const { id } = req.params;
  const { assigned_to_id, instructions, deadline } = req.body;

  if (!assigned_to_id) {
    return res.status(400).json({ error: 'Vui lòng chọn cán bộ / chuyên viên xử lý' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) {
    return res.status(404).json({ error: 'Không tìm thấy công văn' });
  }

  const assignedUser = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(assigned_to_id);
  if (!assignedUser) {
    return res.status(404).json({ error: 'Cán bộ nhận việc không tồn tại' });
  }

  const insertProc = db.prepare(`
    INSERT INTO document_processing (document_id, assigned_from_id, assigned_to_id, instructions, deadline, progress_status)
    VALUES (?, ?, ?, ?, ?, 'CHUA_XU_LY')
  `);
  insertProc.run(id, req.user.id, assigned_to_id, instructions || null, deadline || null);

  // Update document status to DANG_XU_LY
  db.prepare("UPDATE documents SET status = 'DANG_XU_LY', updated_at = datetime('now', 'localtime') WHERE id = ?").run(id);

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'ASSIGN_DOCUMENT',
    entityType: 'DOCUMENT',
    entityId: id,
    details: `Phân công công văn [${doc.doc_number}] cho [${assignedUser.full_name}]. Ý kiến chỉ đạo: ${instructions || 'Theo quy chế'}`,
    req
  });

  res.json({ message: `Đã phân công xử lý cho ${assignedUser.full_name} thành công!` });
});

// 7. Cập nhật kết quả / tiến độ công việc xử lý
router.patch('/processing/:processId', (req, res) => {
  const { processId } = req.params;
  const { progress_status, result_note } = req.body;

  const proc = db.prepare('SELECT * FROM document_processing WHERE id = ?').get(processId);
  if (!proc) {
    return res.status(404).json({ error: 'Không tìm thấy bản ghi phân công' });
  }

  const completedAt = progress_status === 'DA_HOAN_THANH' ? new Date().toISOString() : proc.completed_at;

  db.prepare(`
    UPDATE document_processing
    SET progress_status = ?, result_note = ?, completed_at = ?
    WHERE id = ?
  `).run(progress_status, result_note || proc.result_note, completedAt, processId);

  // If completed, check if all tasks for this doc are completed, then update document status
  if (progress_status === 'DA_HOAN_THANH') {
    db.prepare("UPDATE documents SET status = 'DA_HOAN_THANH', updated_at = datetime('now', 'localtime') WHERE id = ?").run(proc.document_id);
  }

  logAudit({
    userId: req.user.id,
    username: req.user.username,
    action: 'UPDATE_TASK_PROGRESS',
    entityType: 'PROCESSING',
    entityId: processId,
    details: `Cập nhật trạng thái xử lý công việc: [${progress_status}] - Ghi chú: ${result_note || ''}`,
    req
  });

  res.json({ message: 'Cập nhật tiến độ xử lý thành công' });
});

// 8. Lấy danh sách nhiệm vụ phân công cho người dùng hiện tại
router.get('/tasks/my-tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT p.*,
           doc.doc_number, doc.title as doc_title, doc.doc_type, doc.urgency_level, doc.issued_date,
           from_user.full_name as assigned_from_name
    FROM document_processing p
    JOIN documents doc ON p.document_id = doc.id
    LEFT JOIN users from_user ON p.assigned_from_id = from_user.id
    WHERE p.assigned_to_id = ?
    ORDER BY p.id DESC
  `).all(req.user.id);

  res.json(tasks);
});

module.exports = router;
