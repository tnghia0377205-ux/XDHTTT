const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'qnu_docflow.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department_id INTEGER,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'VAN_THU', 'LANH_DAO', 'CHUYEN_VIEN')),
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'LOCKED')),
      is_first_login INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT NOT NULL CHECK(doc_type IN ('INCOMING', 'OUTGOING')),
      doc_number TEXT NOT NULL,
      issued_date TEXT NOT NULL,
      received_date TEXT,
      title TEXT NOT NULL,
      signer TEXT,
      issuing_unit TEXT NOT NULL,
      receiving_unit_id INTEGER,
      urgency_level TEXT DEFAULT 'THUONG' CHECK(urgency_level IN ('THUONG', 'KHAN', 'HOA_TOC')),
      security_level TEXT DEFAULT 'BINH_THUONG' CHECK(security_level IN ('BINH_THUONG', 'MAT', 'TUYET_MAT')),
      status TEXT DEFAULT 'CHO_TIEP_NHAN' CHECK(status IN ('CHO_TIEP_NHAN', 'DANG_XU_LY', 'DA_HOAN_THANH', 'LUU_TRU')),
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (receiving_unit_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS document_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_processing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      assigned_from_id INTEGER NOT NULL,
      assigned_to_id INTEGER NOT NULL,
      instructions TEXT,
      deadline TEXT,
      progress_status TEXT DEFAULT 'CHUA_XU_LY' CHECK(progress_status IN ('CHUA_XU_LY', 'DANG_XU_LY', 'DA_HOAN_THANH', 'TRA_LAI')),
      result_note TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      completed_at TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_from_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);
    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);

  seedDefaultData();
}

function seedDefaultData() {
  // Check if departments exist
  const depCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
  if (depCount === 0) {
    const insertDep = db.prepare('INSERT INTO departments (code, name, phone, email) VALUES (?, ?, ?, ?)');
    insertDep.run('BGH', 'Ban Giám hiệu - ĐH Quy Nhơn', '0256.3846156', 'bgh@qnu.edu.vn');
    insertDep.run('HCTH', 'Phòng Hành chính - Tổng hợp', '0256.3846888', 'hcth@qnu.edu.vn');
    insertDep.run('TCCB', 'Phòng Tổ chức - Cán bộ', '0256.3846107', 'tccb@qnu.edu.vn');
    insertDep.run('DT', 'Phòng Đào tạo Đại học', '0256.3846860', 'daotao@qnu.edu.vn');
    insertDep.run('CNTT', 'Khoa Công nghệ Thông tin', '0256.3846875', 'fit@qnu.edu.vn');
    insertDep.run('KHTC', 'Phòng Kế hoạch - Tài chính', '0256.3846861', 'khtc@qnu.edu.vn');
  }

  // Check if users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const vanthuHash = bcrypt.hashSync('vanthu123', salt);
    const lanhdaoHash = bcrypt.hashSync('lanhdao123', salt);
    const chuyenvienHash = bcrypt.hashSync('chuyenvien123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, phone, department_id, role, status, is_first_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Admin account (matches user screenshot with id: 1, role: ADMIN, name: Quản trị hệ thống)
    insertUser.run('admin', adminHash, 'Quản trị hệ thống', 'admin@qnu.edu.vn', '0905123456', 2, 'ADMIN', 'ACTIVE', 0);
    insertUser.run('vanthu_mai', vanthuHash, 'Nguyễn Thị Mai', 'mai.nt@qnu.edu.vn', '0905234567', 2, 'VAN_THU', 'ACTIVE', 1);
    insertUser.run('lanhdao_hai', lanhdaoHash, 'TS. Trần Thanh Hải', 'hai.tt@qnu.edu.vn', '0905345678', 1, 'LANH_DAO', 'ACTIVE', 1);
    insertUser.run('chuyenvien_nam', chuyenvienHash, 'Lê Hoàng Nam', 'nam.lh@qnu.edu.vn', '0905456789', 5, 'CHUYEN_VIEN', 'ACTIVE', 1);

    // Initial log
    const insertLog = db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertLog.run(1, 'admin', 'SYSTEM_INIT', 'SYSTEM', '1', 'Khởi tạo hệ thống quản lý văn bản QNU DocFlow với dữ liệu mẫu chuẩn', '127.0.0.1');
  }

  // Check if documents exist
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  if (docCount === 0) {
    const insertDoc = db.prepare(`
      INSERT INTO documents (doc_type, doc_number, issued_date, received_date, title, signer, issuing_unit, receiving_unit_id, urgency_level, security_level, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      'INCOMING',
      '1425/BGDĐT-GDĐH',
      '2026-11-15',
      '2026-11-16',
      'V/v Hướng dẫn triển khai công tác chuyển đổi số và bảo đảm an toàn thông tin năm học 2026 - 2027',
      'Thứ trưởng Hoàng Minh Sơn',
      'Bộ Giáo dục và Đào tạo',
      2,
      'KHAN',
      'BINH_THUONG',
      'DANG_XU_LY',
      'Chuyển Khoa CNTT tham mưu triển khai',
      1
    );

    insertDoc.run(
      'INCOMING',
      '89/UBND-VX',
      '2026-11-18',
      '2026-11-19',
      'Kế hoạch phối hợp tổ chức Hội nghị Xúc tiến Khoa học và Khởi nghiệp sinh viên tỉnh Bình Định',
      'Phó Chủ tịch Lâm Hải Giang',
      'UBND Tỉnh Bình Định',
      1,
      'THUONG',
      'BINH_THUONG',
      'CHO_TIEP_NHAN',
      'Chờ Ban Giám hiệu phân công xử lý',
      1
    );

    insertDoc.run(
      'OUTGOING',
      '356/ĐHQN-HCTH',
      '2026-11-20',
      null,
      'Quyết định ban hành Quy chế tiếp nhận, luân chuyển và quản lý văn bản điện tử tại Trường Đại học Quy Nhơn',
      'Hiệu trưởng Đỗ Ngọc Mỹ',
      'Trường Đại học Quy Nhơn',
      null,
      'THUONG',
      'BINH_THUONG',
      'DA_HOAN_THANH',
      'Đã phát hành rộng rãi đến toàn thể cán bộ, giảng viên',
      1
    );

    insertDoc.run(
      'OUTGOING',
      '357/TB-ĐHQN',
      '2026-11-21',
      null,
      'Thông báo về việc tổ chức tập huấn ứng dụng hệ thống QNU DocFlow cho các đơn vị trực thuộc',
      'Trưởng phòng HCTH',
      'Phòng Hành chính - Tổng hợp',
      null,
      'HOA_TOC',
      'BINH_THUONG',
      'DANG_XU_LY',
      'Đang gửi giấy mời các phòng ban',
      1
    );

    // Seed task processing
    const insertProc = db.prepare(`
      INSERT INTO document_processing (document_id, assigned_from_id, assigned_to_id, instructions, deadline, progress_status, result_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertProc.run(
      1,
      3, // lanhdao_hai
      4, // chuyenvien_nam
      'Nghiên cứu văn bản và soạn thảo dự thảo kế hoạch ứng dụng cho Trường trước ngày 30/11/2026',
      '2026-11-30',
      'DANG_XU_LY',
      'Đang thu thập số liệu hiện trạng hạ tầng mạng của các đơn vị'
    );
  }
}

initDatabase();

module.exports = db;
