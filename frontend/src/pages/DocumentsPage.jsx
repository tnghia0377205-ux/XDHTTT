import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  FileDown,
  FileUp,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  UserCheck,
  Paperclip,
  Eye,
  AlertTriangle,
  X,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DocumentsPage({ docType = 'INCOMING' }) {
  const { user, apiFetch } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetail, setDocDetail] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    doc_number: '',
    issued_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    title: '',
    signer: '',
    issuing_unit: docType === 'OUTGOING' ? 'Trường Đại học Quy Nhơn' : '',
    receiving_unit_id: '',
    urgency_level: 'THUONG',
    security_level: 'BINH_THUONG',
    status: 'CHO_TIEP_NHAN',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Assignment Form State
  const [assignData, setAssignData] = useState({
    assigned_to_id: '',
    instructions: '',
    deadline: ''
  });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'VAN_THU';

  const fetchDocuments = () => {
    setLoading(true);
    let url = `/api/documents?doc_type=${docType}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (urgencyFilter) url += `&urgency_level=${urgencyFilter}`;

    apiFetch(url)
      .then(res => res.json())
      .then(data => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, [docType, statusFilter, urgencyFilter]);

  useEffect(() => {
    // Load departments
    apiFetch('/api/departments')
      .then(res => res.json())
      .then(setDepartments)
      .catch(console.error);

    // If admin or van thu, load users for assignment
    if (user?.role === 'ADMIN' || user?.role === 'VAN_THU' || user?.role === 'LANH_DAO') {
      apiFetch('/api/users')
        .then(res => res.json())
        .then(setUsersList)
        .catch(console.error);
    }
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      doc_number: '',
      issued_date: new Date().toISOString().split('T')[0],
      received_date: new Date().toISOString().split('T')[0],
      title: '',
      signer: '',
      issuing_unit: docType === 'OUTGOING' ? 'Trường Đại học Quy Nhơn' : '',
      receiving_unit_id: '',
      urgency_level: 'THUONG',
      security_level: 'BINH_THUONG',
      status: docType === 'OUTGOING' ? 'DANG_XU_LY' : 'CHO_TIEP_NHAN',
      notes: ''
    });
    setSelectedFiles([]);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setSelectedDoc(doc);
    setFormData({
      doc_number: doc.doc_number,
      issued_date: doc.issued_date,
      received_date: doc.received_date || '',
      title: doc.title,
      signer: doc.signer || '',
      issuing_unit: doc.issuing_unit,
      receiving_unit_id: doc.receiving_unit_id || '',
      urgency_level: doc.urgency_level,
      security_level: doc.security_level,
      status: doc.status,
      notes: doc.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleOpenAssign = (doc) => {
    setSelectedDoc(doc);
    setAssignData({
      assigned_to_id: '',
      instructions: 'Đề nghị đồng chí xử lý và báo cáo kết quả đúng hạn',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsAssignOpen(true);
  };

  const handleOpenDetail = (doc) => {
    setSelectedDoc(doc);
    apiFetch(`/api/documents/${doc.id}`)
      .then(res => res.json())
      .then(data => {
        setDocDetail(data);
        setIsDetailOpen(true);
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công văn này khỏi hệ thống?')) return;
    try {
      const res = await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('doc_type', docType);
    Object.keys(formData).forEach(k => {
      data.append(k, formData[k]);
    });
    for (let i = 0; i < selectedFiles.length; i++) {
      data.append('files', selectedFiles[i]);
    }

    try {
      const res = await apiFetch('/api/documents', {
        method: 'POST',
        body: data
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi thêm công văn');
      }
      setIsAddOpen(false);
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi cập nhật công văn');
      }
      setIsEditOpen(false);
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/documents/${selectedDoc.id}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi phân công');
      }
      setIsAssignOpen(false);
      fetchDocuments();
      alert('Đã phân công cán bộ xử lý thành công!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {docType === 'INCOMING' ? 'Quản lý Văn bản đến' : 'Quản lý Văn bản đi'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {docType === 'INCOMING'
              ? 'Tiếp nhận, vào sổ công văn, chuyển giao xử lý và theo dõi tiến độ văn bản đến'
              : 'Soạn thảo, quản lý số hiệu, trình ký và phát hành công văn đi'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{docType === 'INCOMING' ? 'Tiếp nhận văn bản mới' : 'Soạn thảo văn bản đi'}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchDocuments();
          }}
          className="relative flex-1 min-w-[240px]"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số hiệu, trích yếu, người ký, đơn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="CHO_TIEP_NHAN">Chờ tiếp nhận</option>
            <option value="DANG_XU_LY">Đang xử lý</option>
            <option value="DA_HOAN_THANH">Đã hoàn thành</option>
            <option value="LUU_TRU">Lưu trữ</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">Tất cả độ khẩn</option>
            <option value="THUONG">Thường</option>
            <option value="KHAN">Khẩn</option>
            <option value="HOA_TOC">Hỏa tốc</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Số hiệu</th>
                <th className="py-3 px-4">Trích yếu nội dung</th>
                <th className="py-3 px-4">{docType === 'INCOMING' ? 'Cơ quan gửi' : 'Đơn vị ban hành'}</th>
                <th className="py-3 px-4">Ngày ban hành</th>
                <th className="py-3 px-4">Độ khẩn</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Đang tải danh sách công văn...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Không tìm thấy công văn nào phù hợp
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {doc.doc_number}
                      {doc.attachment_count > 0 && (
                        <span className="ml-1.5 inline-flex items-center text-[11px] text-blue-600">
                          <Paperclip className="w-3 h-3" />
                          <span className="ml-0.5">{doc.attachment_count}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <p className="font-medium text-slate-800 line-clamp-2" title={doc.title}>
                        {doc.title}
                      </p>
                      {doc.signer && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Người ký: {doc.signer}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{doc.issuing_unit}</td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{doc.issued_date}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
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

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        doc.status === 'DA_HOAN_THANH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'DANG_XU_LY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {doc.status === 'DA_HOAN_THANH'
                          ? 'Hoàn thành'
                          : doc.status === 'DANG_XU_LY'
                          ? 'Đang xử lý'
                          : 'Chờ tiếp nhận'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenDetail(doc)}
                        title="Xem chi tiết"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleOpenAssign(doc)}
                            title="Phân công xử lý"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(doc)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(doc.id)}
                            title="Xóa công văn"
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

      {/* Modal: Thêm công văn mới */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                {docType === 'INCOMING' ? 'Tiếp nhận công văn đến mới' : 'Soạn thảo công văn đi'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số hiệu văn bản *</label>
                  <input
                    type="text"
                    required
                    value={formData.doc_number}
                    onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                    placeholder="VD: 1425/BGDĐT-GDĐH"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cơ quan / Đơn vị ban hành *</label>
                  <input
                    type="text"
                    required
                    value={formData.issuing_unit}
                    onChange={(e) => setFormData({ ...formData, issuing_unit: e.target.value })}
                    placeholder="VD: Bộ Giáo dục và Đào tạo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trích yếu nội dung *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tóm tắt trích yếu nội dung công văn..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày ban hành *</label>
                  <input
                    type="date"
                    required
                    value={formData.issued_date}
                    onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {docType === 'INCOMING' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày đến</label>
                    <input
                      type="date"
                      value={formData.received_date}
                      onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người ký</label>
                  <input
                    type="text"
                    value={formData.signer}
                    onChange={(e) => setFormData({ ...formData, signer: e.target.value })}
                    placeholder="VD: Thứ trưởng..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị nhận / Phụ trách</label>
                  <select
                    value={formData.receiving_unit_id}
                    onChange={(e) => setFormData({ ...formData, receiving_unit_id: e.target.value })}
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
                  <label className="block font-semibold text-slate-700 mb-1">Độ khẩn</label>
                  <select
                    value={formData.urgency_level}
                    onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="THUONG">Thường</option>
                    <option value="KHAN">Khẩn</option>
                    <option value="HOA_TOC">Hỏa tốc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Độ mật</label>
                  <select
                    value={formData.security_level}
                    onChange={(e) => setFormData({ ...formData, security_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="BINH_THUONG">Bình thường</option>
                    <option value="MAT">Mật</option>
                    <option value="TUYET_MAT">Tuyệt mật</option>
                  </select>
                </div>
              </div>

              {/* File Attachment Upload */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tệp đính kèm (PDF, Word, Scan)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-slate-600 font-medium">Bấm để tải tệp lên hoặc kéo thả vào đây</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ PDF, DOCX, PNG (Tối đa 25MB)</p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    Đã chọn {selectedFiles.length} tệp đính kèm
                  </p>
                )}
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
                  Lưu công văn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Phân công xử lý */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Giao việc / Phân công xử lý công văn</h3>
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssign} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">{selectedDoc?.doc_number}</p>
                <p className="text-slate-600 mt-0.5 line-clamp-2">{selectedDoc?.title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cán bộ / Chuyên viên tiếp nhận *</label>
                <select
                  required
                  value={assignData.assigned_to_id}
                  onChange={(e) => setAssignData({ ...assignData, assigned_to_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Chọn cán bộ nhận việc</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role}) - {u.department_name || 'Trường'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời hạn hoàn thành (Deadline)</label>
                <input
                  type="date"
                  value={assignData.deadline}
                  onChange={(e) => setAssignData({ ...assignData, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ý kiến chỉ đạo / Hướng dẫn</label>
                <textarea
                  rows={3}
                  value={assignData.instructions}
                  onChange={(e) => setAssignData({ ...assignData, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Xác nhận giao việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem chi tiết công văn */}
      {isDetailOpen && docDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {docDetail.doc_type === 'INCOMING' ? 'Văn bản đến' : 'Văn bản đi'}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">{docDetail.doc_number}</h3>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-slate-400 font-semibold mb-0.5">Trích yếu nội dung</p>
                <p className="text-slate-800 font-semibold text-sm leading-relaxed">{docDetail.title}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Cơ quan ban hành</p>
                  <p className="font-bold text-slate-700 mt-0.5">{docDetail.issuing_unit}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Người ký</p>
                  <p className="font-bold text-slate-700 mt-0.5">{docDetail.signer || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Ngày ban hành</p>
                  <p className="font-bold text-slate-700 mt-0.5">{docDetail.issued_date}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Trạng thái</p>
                  <p className="font-bold text-blue-700 mt-0.5">{docDetail.status}</p>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>Tệp đính kèm ({docDetail.attachments?.length || 0})</span>
                </h4>
                {docDetail.attachments?.length === 0 ? (
                  <p className="text-slate-400 italic">Không có tệp đính kèm</p>
                ) : (
                  <div className="space-y-1.5">
                    {docDetail.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={`/uploads/${att.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-blue-50/50 hover:border-blue-300 transition-colors"
                      >
                        <span className="font-semibold text-slate-700 truncate">{att.original_name}</span>
                        <span className="text-[11px] text-blue-600 font-bold ml-2 shrink-0">Tải về / Xem</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Processing timeline */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Lịch sử luân chuyển & Xử lý</span>
                </h4>
                {docDetail.processing?.length === 0 ? (
                  <p className="text-slate-400 italic">Chưa có lịch sử phân công xử lý</p>
                ) : (
                  <div className="space-y-2 border-l-2 border-purple-200 pl-4 py-1">
                    {docDetail.processing.map((p) => (
                      <div key={p.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                        <p className="font-bold text-slate-800">
                          {p.assigned_from_name} <span className="font-normal text-slate-500">giao cho</span> {p.assigned_to_name}
                        </p>
                        <p className="text-slate-600 mt-0.5">{p.instructions}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>Hạn xử lý: {p.deadline || 'Không có'}</span>
                          <span>•</span>
                          <span className="font-semibold text-purple-700">{p.progress_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
