import React from 'react';
import {
  FileText,
  LayoutDashboard,
  FileDown,
  FileUp,
  Clock,
  FolderArchive,
  Building2,
  Users,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'incoming', label: 'Văn bản đến', icon: FileDown },
    { id: 'outgoing', label: 'Văn bản đi', icon: FileUp },
    { id: 'tasks', label: 'Công việc xử lý', icon: Clock },
    { id: 'archives', label: 'Hồ sơ lưu trữ', icon: FolderArchive },
    { id: 'departments', label: 'Quản lý đơn vị', icon: Building2 },
    ...(isAdmin ? [
      { id: 'users', label: 'Quản lý người dùng', icon: Users },
      { id: 'audit', label: 'Nhật ký thao tác', icon: ShieldCheck }
    ] : [])
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#0B192C] flex flex-col text-slate-300 select-none border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-10 h-10 rounded-full bg-white p-0.5 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
          <img src="/qnu-logo.png" alt="Logo QNU" className="w-full h-full object-contain rounded-full" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base tracking-wide leading-tight">Công văn số QNU</h1>
          <p className="text-xs text-slate-400">Quản lý công văn</p>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 mb-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            QUẢN LÝ HỆ THỐNG
          </div>
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1E293B] text-white shadow-sm border border-slate-700/50'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Badge at Bottom (Matches screenshot) */}
      <div className="p-3 border-t border-slate-800/80 bg-[#081220]/70">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Người dùng'}</p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-800 uppercase">
              {user?.role || 'GUEST'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
