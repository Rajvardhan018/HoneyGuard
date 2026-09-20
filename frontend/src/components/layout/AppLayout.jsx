import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AttackNotificationToast from '../common/AttackNotificationToast';
import QuickAttackModal from '../common/QuickAttackModal';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-honey-bg text-honey-text">
      {/* Left Glass Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>

      {/* Real-time Toast Notifications */}
      <AttackNotificationToast />

      {/* Safe Lab Simulator Modal */}
      <QuickAttackModal />
    </div>
  );
}
