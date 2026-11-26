import React, { useState } from 'react';
import { FileText, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/qnu-campus.webp')" }}
    >
      {/* Dark gradient & blur overlay to ensure contrast and focus */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-blue-950/70 backdrop-blur-[2px]"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-[#0B192C] px-8 py-8 text-center border-b border-slate-800 relative">
          <div className="w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-500/30 border-2 border-blue-400/40">
            <img src="/qnu-logo.png" alt="Logo Trường Đại học Quy Nhơn" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">QNU DocFlow</h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">Hệ thống Quản lý Công văn & Điều hành Văn bản</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Trường Đại học Quy Nhơn</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Tên đăng nhập</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập được cấp"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2.5">Đăng nhập nhanh theo vai trò:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin', 'admin123')}
                className="py-2.5 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl text-center font-semibold text-slate-800 text-xs border border-slate-200 transition-all shadow-sm"
              >
                Admin
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('vanthu_mai', 'vanthu123')}
                className="py-2.5 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl text-center font-semibold text-slate-800 text-xs border border-slate-200 transition-all shadow-sm"
              >
                Văn thư
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('lanhdao_hai', 'lanhdao123')}
                className="py-2.5 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl text-center font-semibold text-slate-800 text-xs border border-slate-200 transition-all shadow-sm"
              >
                Lãnh đạo
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('chuyenvien_nam', 'chuyenvien123')}
                className="py-2.5 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-xl text-center font-semibold text-slate-800 text-xs border border-slate-200 transition-all shadow-sm"
              >
                Chuyên viên
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
