import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, FileText, Send, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TasksPage() {
  const { apiFetch } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressStatus, setProgressStatus] = useState('');
  const [resultNote, setResultNote] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    apiFetch('/api/documents/tasks/my-tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenUpdate = (task) => {
    setSelectedTask(task);
    setProgressStatus(task.progress_status);
    setResultNote(task.result_note || '');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/documents/processing/${selectedTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ progress_status: progressStatus, result_note: resultNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Cập nhật tiến độ xử lý công việc thành công!');
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Công việc xử lý</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Danh mục các công văn được Lãnh đạo hoặc Văn thư phân công cho bạn thực hiện
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Số hiệu</th>
                <th className="py-3 px-4">Nội dung công văn</th>
                <th className="py-3 px-4">Người giao việc</th>
                <th className="py-3 px-4">Hạn xử lý (Deadline)</th>
                <th className="py-3 px-4">Ý kiến chỉ đạo</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Đang tải danh sách công việc...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Hiện tại bạn không có nhiệm vụ xử lý công văn nào chưa hoàn thành
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{task.doc_number}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={task.doc_title}>
                      {task.doc_title}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {task.assigned_from_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {task.deadline ? (
                        <span className="flex items-center gap-1 text-amber-700 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{task.deadline}</span>
                        </span>
                      ) : (
                        'Không giới hạn'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={task.instructions}>
                      {task.instructions || 'Theo quy chế'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        task.progress_status === 'DA_HOAN_THANH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : task.progress_status === 'DANG_XU_LY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.progress_status === 'DA_HOAN_THANH'
                          ? 'Đã xử lý'
                          : task.progress_status === 'DANG_XU_LY'
                          ? 'Đang xử lý'
                          : 'Chưa xử lý'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenUpdate(task)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors"
                      >
                        Báo cáo kết quả
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cập nhật tiến độ */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Cập nhật tiến độ xử lý công văn</h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800">{selectedTask.doc_number}</p>
                <p className="text-slate-600 mt-0.5">{selectedTask.doc_title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái xử lý *</label>
                <select
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                >
                  <option value="CHUA_XU_LY">Chưa xử lý</option>
                  <option value="DANG_XU_LY">Đang xử lý</option>
                  <option value="DA_HOAN_THANH">Đã hoàn thành</option>
                  <option value="TRA_LAI">Trả lại / Kiến nghị chuyển đơn vị khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Báo cáo kết quả / Ghi chú</label>
                <textarea
                  rows={4}
                  value={resultNote}
                  onChange={(e) => setResultNote(e.target.value)}
                  placeholder="Ghi rõ nội dung đã xử lý, văn bản phản hồi hoặc kết quả đạt được..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Lưu báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
