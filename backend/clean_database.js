const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'data', 'qnu_docflow.db');
const db = new DatabaseSync(dbPath);

console.log('=== BẮT ĐẦU LÀM SẠCH VÀ CHUẨN HÓA DỮ LIỆU CSDL QNU DOCFLOW ===');

// Hàm chuẩn hóa chuỗi: xóa zero-width, trim, thu gọn khoảng trắng kép
function cleanText(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // xóa ký tự vô hình
    .replace(/\s+/g, ' ')                  // thu gọn khoảng trắng thừa
    .trim();                               // xóa khoảng trắng đầu cuối
}

// 1. Làm sạch bảng departments
console.log('1. Làm sạch bảng đơn vị (departments)...');
const depts = db.prepare('SELECT * FROM departments').all();
const updateDept = db.prepare('UPDATE departments SET code = ?, name = ?, phone = ?, email = ? WHERE id = ?');
for (const d of depts) {
  updateDept.run(
    cleanText(d.code).toUpperCase(),
    cleanText(d.name),
    d.phone ? cleanText(d.phone) : null,
    d.email ? cleanText(d.email).toLowerCase() : null,
    d.id
  );
}
console.log(`   ✓ Đã chuẩn hóa ${depts.length} đơn vị.`);

// 2. Làm sạch bảng users
console.log('2. Làm sạch bảng người dùng (users)...');
const users = db.prepare('SELECT * FROM users').all();
const updateUser = db.prepare('UPDATE users SET username = ?, full_name = ?, email = ?, phone = ? WHERE id = ?');
for (const u of users) {
  updateUser.run(
    cleanText(u.username).toLowerCase(),
    cleanText(u.full_name),
    u.email ? cleanText(u.email).toLowerCase() : null,
    u.phone ? cleanText(u.phone) : null,
    u.id
  );
}
console.log(`   ✓ Đã chuẩn hóa ${users.length} tài khoản người dùng.`);

// 3. Làm sạch bảng documents
console.log('3. Làm sạch bảng công văn (documents)...');
const docs = db.prepare('SELECT * FROM documents').all();
const updateDoc = db.prepare(`
  UPDATE documents
  SET doc_number = ?, title = ?, signer = ?, issuing_unit = ?, notes = ?
  WHERE id = ?
`);
for (const doc of docs) {
  // Chuẩn hóa số hiệu văn bản: loại bỏ khoảng cách quanh dấu / hoặc -
  let cleanDocNum = cleanText(doc.doc_number)
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*-\s*/g, '-');

  updateDoc.run(
    cleanDocNum,
    cleanText(doc.title),
    doc.signer ? cleanText(doc.signer) : null,
    cleanText(doc.issuing_unit),
    doc.notes ? cleanText(doc.notes) : null,
    doc.id
  );
}
console.log(`   ✓ Đã chuẩn hóa ${docs.length} công văn.`);

// 4. Làm sạch bảng document_processing
console.log('4. Làm sạch bảng quy trình luân chuyển (document_processing)...');
const procs = db.prepare('SELECT * FROM document_processing').all();
const updateProc = db.prepare('UPDATE document_processing SET instructions = ?, result_note = ? WHERE id = ?');
for (const p of procs) {
  updateProc.run(
    p.instructions ? cleanText(p.instructions) : null,
    p.result_note ? cleanText(p.result_note) : null,
    p.id
  );
}
console.log(`   ✓ Đã chuẩn hóa ${procs.length} bản ghi phân công.`);

// 5. Làm sạch bảng audit_logs
console.log('5. Làm sạch và chuẩn hóa nhật ký thao tác (audit_logs)...');
const logs = db.prepare('SELECT * FROM audit_logs').all();
const updateLog = db.prepare('UPDATE audit_logs SET ip_address = ?, details = ? WHERE id = ?');
for (const l of logs) {
  let cleanIp = l.ip_address === '::1' ? '127.0.0.1' : l.ip_address;
  updateLog.run(
    cleanIp,
    l.details ? cleanText(l.details) : null,
    l.id
  );
}
console.log(`   ✓ Đã chuẩn hóa ${logs.length} bản ghi nhật ký.`);

// 6. Tối ưu hóa SQLite (VACUUM & REINDEX)
console.log('6. Chạy VACUUM và REINDEX để dọn dẹp phân mảnh cơ sở dữ liệu...');
db.exec('VACUUM;');
db.exec('REINDEX;');
console.log('   ✓ Cơ sở dữ liệu đã được thu gọn và tái tạo chỉ mục sạch 100%.');

console.log('=== HOÀN TẤT QUÁ TRÌNH LÀM SẠCH DỮ LIỆU! ===');
