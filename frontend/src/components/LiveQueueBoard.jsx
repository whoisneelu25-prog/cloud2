import React, { useState, useEffect } from 'react';
import {
  Tv, Volume2, VolumeX, Maximize, Minimize, Stethoscope,
  Clock, AlertCircle, Sparkles, RefreshCw, UserCheck
} from 'lucide-react';
import { announceToken, playChime } from '../utils/audio';

export default function LiveQueueBoard({
  liveBoard,
  onRefresh,
  isAudioEnabled,
  onToggleAudio
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.log(err));
      setIsFullscreen(false);
    }
  };

  const nowServing = liveBoard?.now_serving || [];
  const upcoming = liveBoard?.upcoming_queue || [];
  const doctors = liveBoard?.doctors || [];

  const filteredServing = selectedDoctorFilter === 'all'
    ? nowServing
    : nowServing.filter(t => t.doctor_id === parseInt(selectedDoctorFilter));

  const filteredUpcoming = selectedDoctorFilter === 'all'
    ? upcoming
    : upcoming.filter(t => t.doctor_id === parseInt(selectedDoctorFilter) || !t.doctor_id);

  return (
    <div className="page-wrapper" style={{ maxWidth: '1800px' }}>
      {/* Top TV Board Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <Tv size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Public Live Queue Display
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#94a3b8' }}>
              <span className="status-dot available" />
              <span>Waiting Room Live Screen • Auto-refreshes in real-time</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Doctor / Department Filter */}
          <select
            className="form-select"
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '180px', padding: '8px 12px' }}
          >
            <option value="all">All Departments / Rooms</option>
            {doctors.map(doc => (
              <option key={doc.doctor_id} value={doc.doctor_id}>
                {doc.doctor_name} ({doc.room_number})
              </option>
            ))}
          </select>

          {/* Test Chime */}
          <button
            onClick={() => { playChime(); }}
            className="btn btn-secondary btn-sm"
            title="Test announcement chime"
          >
            <Volume2 size={15} color="#38bdf8" />
            <span>Test Chime</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary btn-sm"
            title="Toggle TV Fullscreen Mode"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen TV'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh Display Board"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Waiting Room Layout: Giant NOW SERVING + UPCOMING SIDEBAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.1fr)',
        gap: '24px'
      }}>
        {/* LEFT: NOW SERVING BIG DISPLAY CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 10px #10b981',
                animation: 'pulse-serving 1.5s infinite'
              }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Now Calling / In Consultation
              </h3>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {filteredServing.length} active room{filteredServing.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredServing.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: filteredServing.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {filteredServing.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glass-card"
                  style={{
                    padding: '28px',
                    borderRadius: '20px',
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.4) 100%)',
                    border: '2px solid rgba(16, 185, 129, 0.6)',
                    boxShadow: '0 0 35px rgba(16, 185, 129, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span className="badge badge-serving" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                      IN ROOM
                    </span>
                    <button
                      onClick={() => announceToken(ticket.token_number, `${ticket.doctor?.room_number || 'Room'}`)}
                      title="Announce token aloud"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', background: 'rgba(15, 23, 42, 0.8)' }}
                    >
                      <Volume2 size={14} color="#34d399" />
                    </button>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Token Number
                  </div>

                  <div style={{
                    fontSize: '3.8rem',
                    fontWeight: 900,
                    color: '#34d399',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.1,
                    margin: '8px 0 16px 0',
                    textShadow: '0 0 20px rgba(52, 211, 153, 0.5)'
                  }}>
                    {ticket.token_number}
                  </div>

                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Proceed to:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {ticket.doctor?.room_number || 'Consultation Room'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Doctor:</span>
                      <span style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>
                        {ticket.doctor?.name || 'Assigned Physician'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Patient:</span>
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {ticket.patient?.full_name} ({ticket.patient?.mrn})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{
              textAlign: 'center',
              padding: '60px 30px',
              borderRadius: '20px'
            }}>
              <UserCheck size={50} color="#64748b" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#cbd5e1', marginBottom: '8px' }}>
                No Patients In Active Consultation
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Doctors can click "Call Next Patient" in their station to call waiting tickets.
              </p>
            </div>
          )}

          {/* DOCTORS & ROOM ALLOCATION STATUS */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#f8fafc' }}>
              All Department Rooms Status
            </h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Status</th>
                    <th>Current Token</th>
                    <th>Waiting</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(doc => (
                    <tr key={doc.doctor_id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {doc.room_number}
                      </td>
                      <td style={{ fontWeight: 600 }}>{doc.doctor_name}</td>
                      <td style={{ color: '#94a3b8' }}>{doc.specialization}</td>
                      <td>
                        <span className={`badge ${doc.status === 'available' ? 'badge-serving' : 'badge-skipped'}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        {doc.current_token ? (
                          <span className="token-chip" style={{ background: '#10b981', color: 'white', fontSize: '0.85rem' }}>
                            {doc.current_token}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: doc.waiting_count > 0 ? '#fbbf24' : '#64748b' }}>
                        {doc.waiting_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: UPCOMING QUEUE LIST */}
        <div className="glass-card" style={{
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: 'fit-content'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            paddingBottom: '12px',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next in Queue
              </h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {filteredUpcoming.length} waiting
            </span>
          </div>

          {filteredUpcoming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUpcoming.map((ticket, index) => (
                <div
                  key={ticket.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: index === 0 ? 'rgba(2, 132, 199, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                    border: index === 0 ? '1px solid #0284c7' : '1px solid #334155'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: index === 0 ? '#38bdf8' : '#64748b',
                      width: '24px'
                    }}>
                      #{index + 1}
                    </span>
                    <span
                      className="token-chip"
                      style={{
                        background: index === 0 ? '#0284c7' : '#1e293b',
                        color: 'white',
                        border: '1px solid #334155',
                        fontSize: '1rem',
                        fontWeight: 800
                      }}
                    >
                      {ticket.token_number}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc' }}>
                        {ticket.patient?.full_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {ticket.doctor?.name || 'General Queue'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${ticket.priority}`} style={{ fontSize: '0.7rem' }}>
                      {ticket.priority}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                      ~{ticket.estimated_wait_minutes} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              <p>Queue is currently clear.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
