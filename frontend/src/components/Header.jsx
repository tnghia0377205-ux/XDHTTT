import React, { useState } from 'react';
import { Bell, Search, User, KeyRound, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onOpenChangePassword, onSearch }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 leading-tight">Hệ thống quản lý văn bản</h2>
        <p className="text-xs text-slate-500">Trường Đại học Quy Nhơn</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm công văn, số hiệu..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/70 focus:bg-white rounded-lg border border-transparent focus:border-blue-500 focus:outline-none w-64 transition-all"
          />
        </form>

        {/* Notifications */}
        <button
          title="Thông báo hệ thống"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 text-xs text-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <span className="font-semibold">{user?.username || 'admin'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-xs text-slate-700 z-30"
              onClick={() => setDropdownOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{user?.full_name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email || user?.username}</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{user?.department_name || 'Trường ĐH Quy Nhơn'}</p>
              </div>

              <button
                onClick={onOpenChangePassword}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
