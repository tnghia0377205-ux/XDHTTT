import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Mail, Edit3, Trash2, X, Users, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DepartmentsPage() {
  const { user, apiFetch } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', phone: '', email: '' });

  const canManage = user?.role === 'ADMIN' || user?.role === 'VAN_THU';

  const fetchDepartments = () => {
    setLoading(true);
    apiFetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/departments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsAddOpen(false);
      setFormData({ code: '', name: '', phone: '', email: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (dep) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn vị [${dep.code} - ${dep.name}]?`)) return;
    try {
      const res = await apiFetch(`/api/departments/${dep.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchDepartments();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Đơn vị & Phòng ban</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Danh mục các Khoa, Phòng, Viện, Trung tâm thuộc Trường Đại học Quy Nhơn
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm đơn vị mới</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Đang tải danh sách đơn vị...</div>
        ) : (
          departments.map((dep) => (
            <div
              key={dep.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {dep.code}
                  </div>
                  {canManage && user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(dep)}
                      title="Xóa đơn vị"
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-800 text-sm mb-1">{dep.name}</h3>
                <div className="space-y-1 text-xs text-slate-500">
                  {dep.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dep.phone}</span>
                    </p>
                  )}
                  {dep.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dep.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{dep.user_count || 0} Cán bộ</span>
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>{dep.doc_count || 0} Văn bản</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Thêm đơn vị */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Thêm đơn vị / phòng ban mới</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã đơn vị (viết tắt) *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: CNTT, HCTH, TCCB..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đơn vị đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Khoa Công nghệ Thông tin"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0256.3846..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email đơn vị</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: fit@qnu.edu.vn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Lưu đơn vị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
