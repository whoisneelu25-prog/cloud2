import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import DashboardView from './components/DashboardView';
import LiveQueueBoard from './components/LiveQueueBoard';
import PatientRegistration from './components/PatientRegistration';
import DoctorStation from './components/DoctorStation';
import ReceptionQueueManager from './components/ReceptionQueueManager';
import DoctorManagement from './components/DoctorManagement';
import WalkInModal from './components/WalkInModal';

import { api } from './services/api';
import { announceToken } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbHealth, setDbHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [liveBoard, setLiveBoard] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Walk-in modal state
  const [isWalkinOpen, setIsWalkinOpen] = useState(false);
  const [walkinPatient, setWalkinPatient] = useState(null);

  // Keep track of previous serving tokens for auto-announcements
  const prevServingTokensRef = useRef(new Set());

  const notify = (type, title, message) => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Main data loader
  const refreshData = async () => {
    try {
      const [healthRes, statsRes, docsRes, boardRes] = await Promise.all([
        api.getHealth(),
        api.getStats(),
        api.getDoctors(),
        api.getLiveDisplay()
      ]);

      setDbHealth(healthRes);
      setStats(statsRes);
      setDoctors(docsRes);
      setLiveBoard(boardRes);

      // Check if new tokens are called for sound announcement
      if (isAudioEnabled && boardRes?.now_serving) {
        const currentServingIds = new Set(boardRes.now_serving.map(t => `${t.id}-${t.token_number}`));
        boardRes.now_serving.forEach(ticket => {
          const key = `${ticket.id}-${ticket.token_number}`;
          if (!prevServingTokensRef.current.has(key) && prevServingTokensRef.current.size > 0) {
            // New serving token detected
            announceToken(ticket.token_number, `${ticket.doctor?.room_number || 'Room'}`);
          }
        });
        prevServingTokensRef.current = currentServingIds;
      }
    } catch (err) {
      console.warn('Sync error with local MySQL API:', err);
    }
  };

  // Initial load and periodic polling interval (every 3 seconds)
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [isAudioEnabled]);

  const handleOpenWalkin = (patient = null) => {
    setWalkinPatient(patient);
    setIsWalkinOpen(true);
  };

  const handleCallNextDoctor = async (doctorId) => {
    try {
      const ticket = await api.doctorCallNext(doctorId);
      if (ticket) {
        const doc = doctors.find(d => d.id === doctorId);
        notify('success', 'Patient Called', `Token ${ticket.token_number} (${ticket.patient?.full_name}) called to ${doc?.room_number || 'Room'}`);
        if (isAudioEnabled) {
          announceToken(ticket.token_number, `${doc?.room_number || 'Room'}`);
        }
      } else {
        notify('info', 'Queue Empty', 'No waiting patients in queue for this doctor.');
      }
      refreshData();
    } catch (err) {
      notify('error', 'Call Failed', err.message);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      const res = await api.seedSampleData();
      notify('success', 'Demo Data Ready', res.message);
      refreshData();
    } catch (err) {
      notify('error', 'Seeding Failed', err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        doctors={doctors}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Bar */}
        <Header
          dbHealth={dbHealth}
          onRefresh={refreshData}
          onOpenWalkin={() => handleOpenWalkin(null)}
          isAudioEnabled={isAudioEnabled}
          onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
          activeTab={activeTab}
        />

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            doctors={doctors}
            liveBoard={liveBoard}
            onOpenWalkin={() => handleOpenWalkin(null)}
            onOpenRegister={() => setActiveTab('patients')}
            onNavigate={setActiveTab}
            onCallNextDoctor={handleCallNextDoctor}
            onSeedData={handleSeedDemoData}
          />
        )}

        {activeTab === 'live-board' && (
          <LiveQueueBoard
            liveBoard={liveBoard}
            onRefresh={refreshData}
            isAudioEnabled={isAudioEnabled}
            onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
          />
        )}

        {activeTab === 'patients' && (
          <PatientRegistration
            doctors={doctors}
            onNotify={notify}
            onOpenWalkinWithPatient={(patient) => handleOpenWalkin(patient)}
          />
        )}

        {activeTab === 'doctor-station' && (
          <DoctorStation
            doctors={doctors}
            onNotify={notify}
            onRefreshStats={refreshData}
          />
        )}

        {activeTab === 'queue-manager' && (
          <ReceptionQueueManager
            doctors={doctors}
            onNotify={notify}
            onOpenWalkin={() => handleOpenWalkin(null)}
            onRefreshStats={refreshData}
          />
        )}

        {activeTab === 'admin' && (
          <DoctorManagement
            doctors={doctors}
            dbHealth={dbHealth}
            onRefresh={refreshData}
            onNotify={notify}
            onSeedData={handleSeedDemoData}
          />
        )}
      </main>

      {/* Quick Walk-in Modal */}
      <WalkInModal
        isOpen={isWalkinOpen}
        onClose={() => setIsWalkinOpen(false)}
        doctors={doctors}
        preselectedPatient={walkinPatient}
        onNotify={notify}
        onSuccess={refreshData}
      />
    </div>
  );
}
