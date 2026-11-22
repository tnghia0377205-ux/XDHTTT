import React, { useState, useEffect } from 'react';
import {
  FileDown,
  FileUp,
  Clock,
  CheckCircle2,
  Shield,
  ArrowRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onNavigate }) {
  const { user, apiFetch } = useAuth();
  const [stats, setStats] = useState({
    incoming_count: 0,
    outgoing_count: 0,
    processing_count: 0,
    completed_count: 0,
    recent_documents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/stats/overview')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải thống kê:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Title & Greeting matching screenshot */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tổng quan hệ thống</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Xin chào, {user?.full_name || 'Quản trị hệ thống'}. Chào mừng quay trở lại QNU DocFlow!
        </p>
      </div>

      {/* 4 Stat Cards Row (Exact layout from screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Văn bản đến */}
        <div
          onClick={() => onNavigate('incoming')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Văn bản đến</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                {loading ? '—' : stats.incoming_count}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {loading ? 'Chờ kết nối API thống kê' : 'Tổng số văn bản đến'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileDown className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Văn bản đi */}
        <div
          onClick={() => onNavigate('outgoing')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Văn bản đi</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                {loading ? '—' : stats.outgoing_count}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {loading ? 'Chờ kết nối API thống kê' : 'Tổng số văn bản ban hành'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Đang xử lý */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Đang xử lý</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                {loading ? '—' : stats.processing_count}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {loading ? 'Chờ kết nối API thống kê' : 'Hồ sơ đang luân chuyển'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Đã hoàn thành */}
        <div
          onClick={() => onNavigate('incoming')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Đã hoàn thành</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                {loading ? '—' : stats.completed_count}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {loading ? 'Chờ kết nối API thống kê' : 'Hồ sơ đã xử lý xong'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Account Info Card (Matches screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Thông tin tài khoản</h3>
            <p className="text-xs text-slate-500">Dữ liệu được lấy từ SQL Server</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div>
            <p className="text-slate-400 font-medium mb-1">Họ và tên</p>
            <p className="font-bold text-slate-800 text-sm">{user?.full_name || 'Quản trị hệ thống'}</p>
          </div>

          <div>
            <p className="text-slate-400 font-medium mb-1">Tên đăng nhập</p>
            <p className="font-bold text-slate-800 text-sm">{user?.username || 'admin'}</p>
          </div>

          <div>
            <p className="text-slate-400 font-medium mb-1">Mã người dùng</p>
            <p className="font-bold text-slate-800 text-sm">{user?.id || '1'}</p>
          </div>

          <div>
            <p className="text-slate-400 font-medium mb-1">Vai trò</p>
            <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              {user?.role || 'ADMIN'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Documents Table Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Văn bản mới cập nhật gần đây</h3>
            <p className="text-xs text-slate-500">Danh sách công văn mới nhất trong hệ thống</p>
          </div>
          <button
            onClick={() => onNavigate('incoming')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Loại</th>
                <th className="py-2.5 px-3">Số hiệu</th>
                <th className="py-2.5 px-3">Trích yếu nội dung</th>
                <th className="py-2.5 px-3">Ngày ban hành</th>
                <th className="py-2.5 px-3">Độ khẩn</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    Chưa có công văn nào trong hệ thống
                  </td>
                </tr>
              ) : (
                stats.recent_documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        doc.doc_type === 'INCOMING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {doc.doc_type === 'INCOMING' ? 'Đến' : 'Đi'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{doc.doc_number}</td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-md truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{doc.issued_date}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        doc.urgency_level === 'HOA_TOC'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : doc.urgency_level === 'KHAN'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.urgency_level === 'HOA_TOC' ? 'Hỏa tốc' : doc.urgency_level === 'KHAN' ? 'Khẩn' : 'Thường'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        doc.status === 'DA_HOAN_THANH'
                          ? 'bg-emerald-50 text-emerald-700'
                          : doc.status === 'DANG_XU_LY'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.status === 'DA_HOAN_THANH' ? 'Hoàn thành' : doc.status === 'DANG_XU_LY' ? 'Đang xử lý' : 'Chờ tiếp nhận'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Banner (Matches screenshot) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">QNU DocFlow - Hệ thống Quản lý Công văn điện tử</h4>
          <p className="text-xs text-blue-200 mt-0.5">
            Phục vụ điều hành, lưu trữ và luân chuyển văn bản tại Trường Đại học Quy Nhơn.
          </p>
        </div>
        <button
          onClick={() => onNavigate('incoming')}
          className="px-4 py-2 bg-white text-blue-900 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-sm shrink-0"
        >
          Quản lý công văn ngay
        </button>
      </div>
    </div>
  );
}
