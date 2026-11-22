const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./src/db');
const { JWT_SECRET } = require('./src/middleware/auth');

console.log('--- BẮT ĐẦU KIỂM THỬ HỆ THỐNG QNU DOCFLOW ---');

// Test 1: Verify Seed Data
console.log('1. Kiểm tra CSDL và Dữ liệu mẫu (Seed Data)...');
const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
assert(adminUser, 'Tài khoản admin phải tồn tại');
assert.strictEqual(adminUser.role, 'ADMIN', 'Vai trò admin phải là ADMIN');
assert(bcrypt.compareSync('admin123', adminUser.password_hash), 'Mật khẩu admin123 phải khớp');
console.log('   ✓ CSDL khởi tạo tốt, tài khoản Admin hợp lệ');

// Test 2: Check Users & Roles
console.log('2. Kiểm tra phân quyền các tài khoản (RBAC)...');
const vanthu = db.prepare('SELECT * FROM users WHERE username = ?').get('vanthu_mai');
const lanhdao = db.prepare('SELECT * FROM users WHERE username = ?').get('lanhdao_hai');
const chuyenvien = db.prepare('SELECT * FROM users WHERE username = ?').get('chuyenvien_nam');
assert(vanthu && vanthu.role === 'VAN_THU', 'Tài khoản Văn thư hợp lệ');
assert(lanhdao && lanhdao.role === 'LANH_DAO', 'Tài khoản Lãnh đạo hợp lệ');
assert(chuyenvien && chuyenvien.role === 'CHUYEN_VIEN', 'Tài khoản Chuyên viên hợp lệ');
console.log('   ✓ Đầy đủ các vai trò: ADMIN, VAN_THU, LANH_DAO, CHUYEN_VIEN');

// Test 3: Check Documents
console.log('3. Kiểm tra danh mục công văn...');
const docs = db.prepare('SELECT * FROM documents').all();
assert(docs.length >= 4, 'Phải có tối thiểu 4 công văn mẫu');
const incoming = docs.filter(d => d.doc_type === 'INCOMING');
const outgoing = docs.filter(d => d.doc_type === 'OUTGOING');
assert(incoming.length >= 2, 'Có văn bản đến mẫu');
assert(outgoing.length >= 2, 'Có văn bản đi mẫu');
console.log(`   ✓ Có ${incoming.length} văn bản đến và ${outgoing.length} văn bản đi mẫu`);

// Test 4: Check Audit Logs
console.log('4. Kiểm tra hệ thống Nhật ký Thao tác (Audit Logs)...');
const logs = db.prepare('SELECT * FROM audit_logs').all();
assert(logs.length >= 1, 'Hệ thống phải có ít nhất 1 bản ghi audit log');
console.log(`   ✓ Hệ thống lưu vết ghi nhận ${logs.length} bản ghi nhật ký`);

// Test 5: Verify Departments
console.log('5. Kiểm tra danh mục Đơn vị / Phòng ban...');
const depts = db.prepare('SELECT * FROM departments').all();
assert(depts.length >= 5, 'Phải có các phòng ban của Trường ĐH Quy Nhơn');
console.log(`   ✓ Có ${depts.length} đơn vị/phòng ban sẵn sàng`);

console.log('--- TOÀN BỘ BÀI TEST CHẠY THÀNH CÔNG VỚI ĐỘ CHÍNH XÁC 100%! ---');
