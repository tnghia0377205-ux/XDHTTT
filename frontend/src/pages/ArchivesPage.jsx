import React, { useState, useEffect } from 'react';
import { FolderArchive, Archive, FileText, Download, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ArchivesPage() {
  const { apiFetch } = useAuth();
  const [archives, setArchives] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/documents?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        setArchives(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hồ sơ lưu trữ công văn</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Lưu trữ, tra cứu mục lục hồ sơ văn bản theo niên hạn và danh mục cơ quan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none shadow-sm"
          >
            <option value="2026">Hồ sơ năm 2026</option>
            <option value="2025">Hồ sơ năm 2025</option>
            <option value="2024">Hồ sơ năm 2024</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">Hồ sơ lưu trữ niên khóa {selectedYear}</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
              {archives.length} văn bản
            </span>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Loại</th>
                <th className="py-2.5 px-3">Số hiệu</th>
                <th className="py-2.5 px-3">Trích yếu</th>
                <th className="py-2.5 px-3">Cơ quan ban hành</th>
                <th className="py-2.5 px-3">Ngày ban hành</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Đang tải hồ sơ...</td>
                </tr>
              ) : archives.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Chưa có văn bản lưu trữ trong năm {selectedYear}</td>
                </tr>
              ) : (
                archives.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-blue-700">
                      {doc.doc_type === 'INCOMING' ? 'Đến' : 'Đi'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{doc.doc_number}</td>
                    <td className="py-2.5 px-3 max-w-md truncate" title={doc.title}>{doc.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{doc.issuing_unit}</td>
                    <td className="py-2.5 px-3 text-slate-500">{doc.issued_date}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
