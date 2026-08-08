import React, { useState, useEffect } from 'react';
import {
  Activity, Database, Volume2, VolumeX, RefreshCw,
  PlusCircle, Clock, ShieldCheck, HeartPulse
} from 'lucide-react';

export default function Header({
  dbHealth,
  onRefresh,
  onOpenWalkin,
  isAudioEnabled,
  onToggleAudio,
  activeTab
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabTitles = {
    dashboard: 'Executive Dashboard & Overview',
    'live-board': 'Live Queue Waiting Room Display',
    patients: 'Patient Directory & Registration',
    'doctor-station': 'Doctor Consultation Panel',
    'queue-manager': 'Reception Desk Queue Controller',
    admin: 'Admin & Doctor Management'
  };

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #334155',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Left: Current View Title & Live Pulse */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
        }}>
          <HeartPulse size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            {tabTitles[activeTab] || 'Clinic Flow'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block'
            }} />
            <span>Live System Active</span>
          </div>
        </div>
      </div>

      {/* Right: MySQL DB Status Badge, Sound Toggle, Refresh, Walk-in CTA, Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Local MySQL Server Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: dbHealth?.database === 'connected' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${dbHealth?.database === 'connected' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.4)'}`,
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: dbHealth?.database === 'connected' ? '#34d399' : '#f87171'
        }}>
          <Database size={15} />
          <span>
            {dbHealth?.database === 'connected'
              ? `MySQL: localhost:3306 (${dbHealth.database_name})`
              : 'MySQL: Disconnected'}
          </span>
        </div>

        {/* Live Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid #334155',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)',
          color: '#cbd5e1'
        }}>
          <Clock size={14} color="#38bdf8" />
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Audio Announcement Toggle */}
        <button
          onClick={onToggleAudio}
          title={isAudioEnabled ? 'Voice Announcements Enabled' : 'Voice Announcements Muted'}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px', borderColor: isAudioEnabled ? '#0284c7' : '#334155' }}
        >
          {isAudioEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} color="#94a3b8" />}
          <span style={{ fontSize: '0.8rem' }}>{isAudioEnabled ? 'Sound On' : 'Muted'}</span>
        </button>

        {/* Manual Refresh */}
        <button
          onClick={onRefresh}
          title="Refresh Data from MySQL"
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px' }}
        >
          <RefreshCw size={15} />
        </button>

        {/* Quick Walk-in Button */}
        <button
          onClick={onOpenWalkin}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px' }}
        >
          <PlusCircle size={16} />
          <span>Issue Token</span>
        </button>
      </div>
    </header>
  );
}
