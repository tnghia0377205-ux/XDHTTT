import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user, apiFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    role: 'CHUYEN_VIEN',
    temporary_password: ''
  });
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    apiFetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
    apiFetch('/api/departments')
      .then(res => res.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setIsAddOpen(false);
      setFormData({
        username: '',
        full_name: '',
        email: '',
        phone: '',
        department_id: '',
        role: 'CHUYEN_VIEN',
        temporary_password: ''
      });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const actionName = nextStatus === 'LOCKED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản [${targetUser.username}]?`)) return;

    try {
      const res = await apiFetch(`/api/users/${targetUser.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      setIsResetOpen(false);
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Cảnh báo: Bạn có chắc muốn xóa tài khoản [${targetUser.username}]?`)) return;
    try {
      const res = await apiFetch(`/api/users/${targetUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cấp tài khoản cán bộ, thiết lập phân quyền RBAC, kiểm soát trạng thái khóa và bảo mật
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cấp tài khoản mới</span>
        </button>
      </div>

      {/* Security notice box */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Quy chuẩn An toàn & Quản lý Tài khoản Độc quyền:</p>
          <p className="text-blue-700 mt-0.5">
            Người dùng chỉ có thể truy cập hệ thống khi được Quản trị viên cấp tài khoản. Khi tạo tài khoản mới, hệ thống
            tự động gắn cờ <span className="font-semibold underline">Bắt buộc đổi mật khẩu</span> ở lần đăng nhập đầu tiên.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên đăng nhập</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Đơn vị công tác</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Đổi MK lần đầu</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{u.username}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <div>{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email || 'Chưa cập nhật email'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.department_name || 'Trường ĐH Quy Nhơn'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_first_login ? (
                        <span className="text-[11px] text-amber-600 font-semibold">Chưa đổi</span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">Đã hoàn thành</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewPassword('');
                          setIsResetOpen(true);
                        }}
                        title="Đặt lại mật khẩu"
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {u.id !== user.id && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.status === 'ACTIVE'
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDelete(u)}
                            title="Xóa tài khoản"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cấp tài khoản mới */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Cấp tài khoản cán bộ mới</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="VD: nguyenvanan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mật khẩu tạm thời *</label>
                  <input
                    type="password"
                    required
                    value={formData.temporary_password}
                    onChange={(e) => setFormData({ ...formData, temporary_password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên cán bộ *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: an.nv@qnu.edu.vn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0905123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị công tác</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Chọn đơn vị</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai trò phân quyền *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-blue-700"
                  >
                    <option value="CHUYEN_VIEN">CHUYEN_VIEN (Chuyên viên)</option>
                    <option value="LANH_DAO">LANH_DAO (Lãnh đạo đơn vị)</option>
                    <option value="VAN_THU">VAN_THU (Văn thư trường)</option>
                    <option value="ADMIN">ADMIN (Quản trị hệ thống)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Cấp tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đặt lại mật khẩu */}
      {isResetOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Đặt lại mật khẩu</h3>
              <button onClick={() => setIsResetOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <p className="text-slate-600">
                Đặt lại mật khẩu cho tài khoản <span className="font-bold text-slate-800">[{selectedUser.username}]</span> ({selectedUser.full_name}).
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Xác nhận đặt lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
