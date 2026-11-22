# Hướng Dẫn Sử Dụng & Vận Hành Hệ Thống QNU DocFlow

Hệ thống Quản lý Công văn và Điều hành Văn bản điện tử dành cho **Trường Đại học Quy Nhơn**.

---

## 1. Cấu Trúc Dự Án (`D:\XDHTTT\QLCONGVAN`)

```text
D:\XDHTTT\QLCONGVAN\
├── backend/                       # Máy chủ API Node.js (Port 5000)
│   ├── data/                      # Lưu trữ cơ sở dữ liệu SQLite cục bộ
│   │   └── qnu_docflow.db         # Tự động khởi tạo & seed dữ liệu mẫu
│   ├── uploads/                   # Thư mục lưu trữ tệp đính kèm công văn (PDF, Word, Scan)
│   ├── src/
│   │   ├── middleware/            # Auth JWT, Role Guards & Audit Logger
│   │   ├── routes/                # API Auth, Documents, Users, Departments, Audit, Stats
│   │   ├── db.js                  # Khởi tạo CSDL SQLite & Seeder
│   │   └── server.js              # Express API Server
│   ├── sqlserver_schema.sql       # Kịch bản DDL chuẩn cho Microsoft SQL Server
│   └── package.json
├── frontend/                      # Giao diện người dùng React + Vite + Tailwind (Port 5173)
│   ├── src/
│   │   ├── components/            # Sidebar xanh navy, Header, ChangePasswordModal
│   │   ├── context/               # AuthContext (JWT session, permission check)
│   │   ├── pages/                 # Dashboard, Documents, Tasks, Users, AuditLogs, Login
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── start.bat                      # File khởi động 1-click tự động chạy cả Backend & Frontend
└── README.md
```

---

## 2. Cách Khởi Động Hệ Thống Nhanh Nhất

### Cách 1: Chạy bằng file `start.bat` (Khuyên dùng)
* Nhấp đúp chuột vào file `D:\XDHTTT\QLCONGVAN\start.bat`.
* Hệ thống sẽ tự động bật 2 cửa sổ:
  1. Backend API tại: `http://localhost:5000`
  2. Frontend Vite tại: `http://localhost:5173`
* Trình duyệt sẽ tự động mở trang web sẵn sàng sử dụng!

### Cách 2: Chạy thủ công bằng dòng lệnh (Terminal / PowerShell)

**Mở Terminal 1 - Chạy Backend:**
```powershell
cd D:\XDHTTT\QLCONGVAN\backend
npm start
# Backend chạy tại: http://localhost:5000
```

**Mở Terminal 2 - Chạy Frontend:**
```powershell
cd D:\XDHTTT\QLCONGVAN\frontend
npm run dev
# Frontend chạy tại: http://localhost:5173 (khớp 100% ảnh chụp)
```

---

## 3. Danh Sách Tài Khoản Thử Nghiệm

Hệ thống tuân thủ nghiêm ngặt quy tắc: **Người dùng không thể tự đăng ký tài khoản từ bên ngoài, chỉ có Quản trị viên (ADMIN) mới có quyền cấp tài khoản.**

| Tên đăng nhập | Mật khẩu mặc định | Họ và tên | Vai trò (Role) | Chức năng nổi bật |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin123` | Quản trị hệ thống | `ADMIN` | Toàn quyền hệ thống, cấp tài khoản mới, khóa/mở khóa tài khoản, xem toàn bộ **Nhật ký thao tác (Audit Logs)** |
| `vanthu_mai` | `vanthu123` | Nguyễn Thị Mai | `VAN_THU` | Tiếp nhận văn bản đến, soạn thảo văn bản đi, vào sổ công văn, quản lý tệp đính kèm |
| `lanhdao_hai` | `lanhdao123` | TS. Trần Thanh Hải | `LANH_DAO` | Ban Giám hiệu: Phê duyệt văn bản, phân công xử lý (giao việc) cho chuyên viên kèm hạn chót (Deadline) |
| `chuyenvien_nam` | `chuyenvien123` | Lê Hoàng Nam | `CHUYEN_VIEN` | Nhận công văn được giao tại mục **Công việc xử lý**, cập nhật tiến độ và báo cáo kết quả |

> **Lưu ý bảo mật:** Khi tài khoản mới được cấp (ví dụ: `vanthu_mai`, `lanhdao_hai`, `chuyenvien_nam`), hệ thống sẽ **bắt buộc người dùng phải đổi mật khẩu ngay lần đầu đăng nhập** mới có thể tiếp tục sử dụng.

---

## 4. Các Tính Năng Đã Hiện Thực Hóa

1. **Giao diện chuẩn 100% theo ảnh chụp (`QNU DocFlow`)**:
   * Sidebar xanh navy đậm (`#0B192C`) với logo icon tài liệu, tiêu đề Trường Đại học Quy Nhơn.
   * Danh mục điều hướng: Tổng quan, Văn bản đến, Văn bản đi, Công việc xử lý, Hồ sơ lưu trữ, Quản lý đơn vị, Quản lý người dùng, Nhật ký thao tác.
   * Thẻ thống kê 4 ô: Văn bản đến, Văn bản đi, Đang xử lý, Đã hoàn thành.
   * Khung thông tin tài khoản truy xuất từ CSDL: Họ và tên, Tên đăng nhập, Mã người dùng, Vai trò.
2. **Quản lý Công văn (Thêm, Sửa, Xóa, Phân loại, Tìm kiếm)**:
   * Tiếp nhận văn bản đến (có ngày đến, cơ quan ban hành, độ khẩn, độ mật).
   * Soạn thảo và phát hành văn bản đi (cấp số hiệu công văn trường).
   * Tải lên và xem/tải về tệp đính kèm (PDF, DOCX, scan).
3. **Quy trình Phân công & Xử lý (Workflow)**:
   * Lãnh đạo phân công xử lý cho cán bộ nhận việc, kèm ý kiến chỉ đạo và thời hạn xử lý (Deadline).
   * Chuyên viên xem danh sách tại mục "Công việc xử lý" và báo cáo tiến độ (Chưa xử lý $\rightarrow$ Đang xử lý $\rightarrow$ Đã hoàn thành).
4. **Phân quyền người dùng (RBAC)**:
   * Chặn truy cập trái phép ở cả tầng API Backend (Middleware JWT) và giao diện Frontend.
   * Chỉ Admin mới truy cập được màn hình Quản lý người dùng và Nhật ký thao tác.
5. **Nhật ký thao tác (Audit Logs)**:
   * Tự động ghi nhận mọi sự kiện: Đăng nhập thành công/thất bại, đổi mật khẩu, thêm sửa xóa công văn, cấp quyền, khóa tài khoản.
   * Lưu trữ chi tiết: Ai làm, lúc nào, trên đối tượng nào, địa chỉ IP client, nội dung chi tiết.
   * Bộ lọc thông minh giúp Admin tra cứu lịch sử nhanh chóng.
6. **Cơ sở dữ liệu kép**:
   * Sẵn sàng chạy ngay với **SQLite tích hợp** (Zero-setup).
   * Kèm file script **`sqlserver_schema.sql`** chuẩn Microsoft SQL Server với Collation `Vietnamese_CI_AS` để triển khai máy chủ trường học khi cần.
