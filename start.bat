@echo off
chcp 65001 >nul
echo =========================================================================
echo    HỆ THỐNG CÔNG VĂN SỐ QNU (TRƯỜNG ĐẠI HỌC QUY NHƠN)
echo =========================================================================
echo.
echo [1/3] Đang khởi động Backend API (Port 5000)...
start "Công văn số QNU - Backend API" cmd /k "cd backend && node src/server.js"

echo [2/3] Đang khởi động Frontend Vite (Port 5173)...
start "Công văn số QNU - Frontend" cmd /k "cd frontend && npm run dev"

echo [3/3] Đang mở trình duyệt tại: http://localhost:5173
timeout /t 3 >nul
start http://localhost:5173

echo.
echo =========================================================================
echo  Hệ thống đã khởi động thành công!
echo  - Tài khoản Admin mặc định: admin / admin123
echo  - Tài khoản Văn thư: vanthu_mai / vanthu123
echo  - Tài khoản Lãnh đạo: lanhdao_hai / lanhdao123
echo  - Tài khoản Chuyên viên: chuyenvien_nam / chuyenvien123
echo =========================================================================
pause
