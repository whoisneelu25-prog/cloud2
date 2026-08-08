import React from 'react';
import clinicBanner from '../assets/clinic_banner.png';
import clinicLogo from '../assets/logo.png';
import {
  Users, Clock, CheckCircle2, UserCheck, AlertCircle,
  Play, PlusCircle, UserPlus, Stethoscope, Tv, Sparkles,
  ArrowRight, ShieldCheck, ChevronRight, Building2
} from 'lucide-react';

export default function DashboardView({
  stats,
  doctors,
  liveBoard,
  onOpenWalkin,
  onOpenRegister,
  onNavigate,
  onCallNextDoctor,
  onSeedData
}) {
  const statCards = [
    {
      label: 'Waiting in Queue',
      value: stats?.queue_waiting || 0,
      sub: 'Patients in waiting area',
      icon: Clock,
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.25)',
      action: () => onNavigate('queue-manager')
    },
    {
      label: 'Currently Serving',
      value: stats?.queue_serving || 0,
      sub: 'In consultation rooms',
      icon: UserCheck,
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.25)',
      action: () => onNavigate('live-board')
    },
    {
      label: 'Completed Today',
      value: stats?.queue_completed || 0,
      sub: 'Consultations finished',
      icon: CheckCircle2,
      color: '#0284c7',
      glow: 'rgba(2, 132, 199, 0.25)',
      action: () => onNavigate('queue-manager')
    },
    {
      label: 'Total Registered Patients',
      value: stats?.total_patients || 0,
      sub: `${stats?.today_registrations || 0} registered today`,
      icon: Users,
      color: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.25)',
      action: () => onNavigate('patients')
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Top Banner / Welcome & Quick Action Bar with Visual Asset Backdrop */}
      <div className="glass-card" style={{
        padding: '0',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.6)'
      }}>
        {/* Background Visual Asset with Gradient Tint Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '45%',
          backgroundImage: `url(${clinicBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.35,
          maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.8) 50%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.8) 50%, black 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-serving" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                <span className="status-dot available" /> System Active
              </span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Est. Avg Wait Time: <strong style={{ color: '#38bdf8' }}>{stats?.avg_wait_minutes || 12} mins</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              CareFlow Clinic Operations Center
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '6px', maxWidth: '560px' }}>
              Next-generation real-time patient queue flow, multi-doctor room allocations, and live token orchestration.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenWalkin}
              className="btn btn-primary"
              style={{ padding: '12px 20px', fontWeight: 700, boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)' }}
            >
              <PlusCircle size={18} />
              <span>Issue Walk-in Token</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="btn btn-secondary"
              style={{ padding: '12px 18px', background: 'rgba(30, 41, 59, 0.7)' }}
            >
              <UserPlus size={18} color="#38bdf8" />
              <span>Register Patient</span>
            </button>

            <button
              onClick={() => onNavigate('live-board')}
              className="btn btn-secondary"
              style={{ padding: '12px 18px', background: 'rgba(30, 41, 59, 0.7)' }}
            >
              <Tv size={18} color="#10b981" />
              <span>Open TV Display</span>
            </button>

            <button
              onClick={onSeedData}
              title="Seed realistic sample queue for testing"
              className="btn btn-secondary btn-sm"
              style={{ padding: '12px 14px', borderColor: '#475569', background: 'rgba(30, 41, 59, 0.7)' }}
            >
              <Sparkles size={16} color="#c084fc" />
              <span>Seed Samples</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-card"
              onClick={card.action}
              style={{
                padding: '22px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: card.glow,
                filter: 'blur(20px)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
                  {card.label}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: `${card.color}15`,
                  border: `1px solid ${card.color}35`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <Icon size={18} />
                </div>
              </div>

              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1, marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                {card.value}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>{card.sub}</span>
                <ChevronRight size={15} color="#94a3b8" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Active Serving Room Cards + Waiting Queue Summary */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Left: Active Consultation Rooms */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <Stethoscope size={18} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Active Doctor Rooms</h3>
            </div>
            <button
              onClick={() => onNavigate('doctor-station')}
              className="btn btn-secondary btn-sm"
            >
              <span>Doctor Station</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats?.doctor_summaries?.map(doc => (
              <div
                key={doc.doctor_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #334155'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-dot ${doc.status}`} />
                    <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{doc.doctor_name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px' }}>
                      {doc.room_number}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                    {doc.specialization} • Waiting: <strong style={{ color: '#fbbf24' }}>{doc.waiting_count}</strong> • Completed: <strong style={{ color: '#34d399' }}>{doc.completed_today}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {doc.current_token ? (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Serving</span>
                      <span className="token-chip" style={{ background: '#10b981', color: 'white', fontSize: '1.1rem' }}>
                        {doc.current_token}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      No active token
                    </span>
                  )}

                  <button
                    onClick={() => onCallNextDoctor(doc.doctor_id)}
                    title={`Call next patient for ${doc.doctor_name}`}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '6px 12px' }}
                  >
                    <Play size={13} fill="white" />
                    <span>Call Next</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Waiting Queue Snapshot */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}>
                <Clock size={18} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upcoming in Queue</h3>
            </div>
            <button
              onClick={() => onNavigate('queue-manager')}
              className="btn btn-secondary btn-sm"
            >
              <span>Manage Queue</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {liveBoard?.upcoming_queue && liveBoard.upcoming_queue.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {liveBoard.upcoming_queue.slice(0, 5).map((ticket, idx) => (
                <div
                  key={ticket.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <span className="token-chip" style={{ background: '#0284c7', color: 'white', fontSize: '0.95rem' }}>
                      {ticket.token_number}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                        {ticket.patient?.full_name || 'Walk-in Patient'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        MRN: {ticket.patient?.mrn} • Doctor: {ticket.doctor?.name || 'Any Doctor'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${ticket.priority}`}>
                      {ticket.priority}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      ~{ticket.estimated_wait_minutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#64748b'
            }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
              <p style={{ fontWeight: 600, color: '#94a3b8' }}>No patients currently waiting in queue</p>
              <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Click "Issue Walk-in Token" above to add a new patient.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
