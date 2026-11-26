import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChangePasswordModal from './components/ChangePasswordModal';

import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import TasksPage from './pages/TasksPage';
import ArchivesPage from './pages/ArchivesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold tracking-wide text-slate-300">Đang khởi động Công văn số QNU...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Force change password if first login
  const isForcedPasswordChange = Boolean(user.is_first_login);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'incoming':
        return <DocumentsPage docType="INCOMING" />;
      case 'outgoing':
        return <DocumentsPage docType="OUTGOING" />;
      case 'tasks':
        return <TasksPage />;
      case 'archives':
        return <ArchivesPage />;
      case 'departments':
        return <DepartmentsPage />;
      case 'users':
        return <UsersPage />;
      case 'audit':
        return <AuditLogsPage />;
      default:
        return <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row font-['Inter',sans-serif]">
      {/* Sidebar (matches screenshot) */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenChangePassword={() => setIsChangePasswordOpen(true)} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen || isForcedPasswordChange}
        isForced={isForcedPasswordChange}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
