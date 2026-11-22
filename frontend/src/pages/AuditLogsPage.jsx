import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Terminal,
  Activity,
  User,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsPage() {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    let url = '/api/audit?limit=100';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (actionFilter) url += `&action=${actionFilter}`;

    apiFetch(url)
      .then(res => res.json())
      .then(data => {
        setLogs(data.items || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action) => {
    if (action.includes('LOGIN')) {
      return action === 'LOGIN_SUCCESS'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200';
    }
    if (action.includes('CREATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('DELETE') || action.includes('LOCK')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('ASSIGN') || action.includes('UPDATE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Nhật ký thao tác hệ thống</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ghi vết toàn diện mọi hành vi: đăng nhập, tạo sửa xóa công văn, cấp quyền và đổi mật khẩu của các tài khoản
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLogs();
          }}
          className="relative flex-1 min-w-[240px]"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tài khoản, địa chỉ IP, nội dung thao tác..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">Tất cả loại hành vi</option>
            <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
            <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
            <option value="CHANGE_PASSWORD">Đổi mật khẩu</option>
            <option value="CREATE_USER">Cấp tài khoản mới</option>
            <option value="LOCK_USER">Khóa tài khoản</option>
            <option value="UNLOCK_USER">Mở khóa tài khoản</option>
            <option value="CREATE_INCOMING_DOC">Tiếp nhận văn bản đến</option>
            <option value="CREATE_OUTGOING_DOC">Soạn thảo văn bản đi</option>
            <option value="ASSIGN_DOCUMENT">Phân công xử lý</option>
            <option value="DELETE_DOCUMENT">Xóa văn bản</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Chi tiết thao tác</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Chưa có bản ghi nhật ký nào phù hợp
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.created_at}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.username}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>

                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.ip_address}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Details */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Chi tiết nhật ký kiểm toán #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Tài khoản thao tác</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedLog.username}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Thời gian thực hiện</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedLog.created_at}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Hành động</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5 ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Địa chỉ IP Client</p>
                  <p className="font-mono text-slate-700 mt-0.5">{selectedLog.ip_address}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Dữ liệu chi tiết ghi nhận:</p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-60">
                  {selectedLog.details}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
