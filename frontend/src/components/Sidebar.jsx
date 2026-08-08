import React from 'react';
import clinicLogo from '../assets/logo.png';
import {
  LayoutDashboard, Tv, Users, Stethoscope,
  ListOrdered, Settings, Shield, Activity, UserPlus
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  doctors
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'live-board',
      label: 'Live Queue TV',
      icon: Tv,
      badge: stats?.queue_serving > 0 ? `${stats.queue_serving} Serving` : null,
      badgeColor: '#10b981'
    },
    {
      id: 'patients',
      label: 'Patients & Register',
      icon: Users,
      badge: stats?.total_patients ? `${stats.total_patients}` : null
    },
    {
      id: 'doctor-station',
      label: 'Doctor Panel',
      icon: Stethoscope,
      badge: stats?.queue_waiting > 0 ? `${stats.queue_waiting} Waiting` : null,
      badgeColor: '#f59e0b'
    },
    {
      id: 'queue-manager',
      label: 'Reception Queue',
      icon: ListOrdered,
      badge: (stats?.queue_waiting || stats?.queue_serving) ? `${(stats.queue_waiting || 0) + (stats.queue_serving || 0)}` : null
    },
    {
      id: 'admin',
      label: 'Doctors & Admin',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '22px 18px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(6, 182, 212, 0.4) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(2, 132, 199, 0.35)',
          overflow: 'hidden'
        }}>
          <img
            src={clinicLogo}
            alt="CareFlow Clinic"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            CareFlow
          </h1>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Clinic Queue Engine
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          fontSize: '0.72rem',
          color: '#64748b',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '8px 12px 4px 12px'
        }}>
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.4)';
                  e.currentTarget.style.color = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={19} color={isActive ? '#38bdf8' : '#94a3b8'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: item.badgeColor ? `${item.badgeColor}22` : 'rgba(51, 65, 85, 0.8)',
                  color: item.badgeColor || '#94a3b8',
                  border: `1px solid ${item.badgeColor ? `${item.badgeColor}44` : '#475569'}`,
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Doctor Availability Footer Matrix */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #334155',
        backgroundColor: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Rooms & Doctors
          </span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            {doctors?.filter(d => d.status === 'available').length || 0} Online
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
          {doctors && doctors.slice(0, 4).map(doc => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span className={`status-dot ${doc.status}`} />
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{doc.name.replace('Dr. ', '')}</span>
              </div>
              <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{doc.room_number}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
