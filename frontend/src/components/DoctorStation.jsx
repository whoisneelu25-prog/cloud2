import React, { useState, useEffect } from 'react';
import {
  Stethoscope, UserCheck, Play, CheckCircle2, RotateCcw,
  AlertCircle, Clock, FileText, User, Phone, Droplet, Volume2
} from 'lucide-react';
import { api } from '../services/api';
import { announceToken } from '../utils/audio';

export default function DoctorStation({
  doctors,
  onNotify,
  onRefreshStats
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorQueue, setDoctorQueue] = useState([]);
  const [currentServing, setCurrentServing] = useState(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Set initial selected doctor
  useEffect(() => {
    if (doctors && doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id.toString());
    }
  }, [doctors]);

  const activeDoctor = doctors?.find(d => d.id === parseInt(selectedDoctorId));

  const loadDoctorQueue = async () => {
    if (!selectedDoctorId) return;
    setLoading(true);
    try {
      const tickets = await api.getQueue({ doctor_id: selectedDoctorId });
      setDoctorQueue(tickets);
      const serving = tickets.find(t => t.status === 'serving');
      setCurrentServing(serving || null);
      if (serving && !prescriptionNotes) {
        setPrescriptionNotes(serving.prescription_summary || '');
      }
    } catch (err) {
      onNotify('error', 'Failed to fetch doctor queue', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorQueue();
    }
  }, [selectedDoctorId]);

  const handleCallNext = async () => {
    if (!selectedDoctorId) return;
    try {
      const ticket = await api.doctorCallNext(selectedDoctorId);
      if (ticket) {
        setCurrentServing(ticket);
        setPrescriptionNotes('');
        onNotify('success', 'Next Patient Called', `Calling token ${ticket.token_number} (${ticket.patient?.full_name}) to ${activeDoctor?.room_number}`);
        announceToken(ticket.token_number, `${activeDoctor?.room_number || 'Room'}`);
      } else {
        onNotify('info', 'Queue Empty', 'There are no waiting patients in queue for this doctor.');
      }
      loadDoctorQueue();
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Call Failed', err.message);
    }
  };

  const handleRecall = () => {
    if (!currentServing) return;
    announceToken(currentServing.token_number, `${activeDoctor?.room_number || 'Room'}`);
    onNotify('info', 'Announcement Repeated', `Re-announcing token ${currentServing.token_number} for ${activeDoctor?.room_number}`);
  };

  const handleCompleteConsultation = async () => {
    if (!currentServing) return;
    try {
      await api.updateQueueTicketStatus(currentServing.id, {
        status: 'completed',
        prescription_summary: prescriptionNotes,
        doctor_id: parseInt(selectedDoctorId)
      });

      onNotify('success', 'Consultation Completed', `Token ${currentServing.token_number} marked as completed.`);
      setCurrentServing(null);
      setPrescriptionNotes('');
      loadDoctorQueue();
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Failed to complete consultation', err.message);
    }
  };

  const handleSkipPatient = async (ticket) => {
    try {
      await api.updateQueueTicketStatus(ticket.id, {
        status: 'skipped'
      });
      onNotify('warning', 'Patient Skipped', `Token ${ticket.token_number} marked as skipped.`);
      loadDoctorQueue();
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Action failed', err.message);
    }
  };

  const handleUpdateDoctorStatus = async (newStatus) => {
    if (!activeDoctor) return;
    try {
      await api.updateDoctor(activeDoctor.id, { status: newStatus });
      onNotify('success', 'Doctor Status Updated', `${activeDoctor.name} is now ${newStatus.replace('_', ' ')}`);
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Status update failed', err.message);
    }
  };

  const waitingList = doctorQueue.filter(t => t.status === 'waiting');
  const completedList = doctorQueue.filter(t => t.status === 'completed');

  return (
    <div className="page-wrapper">
      {/* Top Bar: Doctor Selector & Status Controls */}
      <div className="glass-card" style={{
        padding: '20px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)'
          }}>
            <Stethoscope size={26} />
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Doctor Consultation Desk
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ fontSize: '1.1rem', fontWeight: 700, padding: '6px 14px', width: 'auto', minWidth: '260px' }}
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialization} ({doc.room_number})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Doctor Status Switcher Buttons */}
        {activeDoctor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginRight: '4px' }}>My Status:</span>
            <button
              onClick={() => handleUpdateDoctorStatus('available')}
              className={`btn btn-sm ${activeDoctor.status === 'available' ? 'btn-success' : 'btn-secondary'}`}
            >
              <span className="status-dot available" />
              <span>Available</span>
            </button>
            <button
              onClick={() => handleUpdateDoctorStatus('busy')}
              className={`btn btn-sm ${activeDoctor.status === 'busy' ? 'btn-warning' : 'btn-secondary'}`}
            >
              <span className="status-dot busy" />
              <span>In Consult / Busy</span>
            </button>
            <button
              onClick={() => handleUpdateDoctorStatus('off_duty')}
              className={`btn btn-sm ${activeDoctor.status === 'off_duty' ? 'btn-danger' : 'btn-secondary'}`}
            >
              <span className="status-dot off_duty" />
              <span>Off Duty</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Active Consultation Workspace & Doctor's Waiting Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
        {/* LEFT: ACTIVE CONSULTATION WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentServing ? (
            <div className="glass-card" style={{
              padding: '28px',
              borderRadius: '20px',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
            }}>
              {/* Header with Token & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className="token-chip serving-live" style={{ fontSize: '2.2rem', padding: '8px 20px' }}>
                    {currentServing.token_number}
                  </span>
                  <div>
                    <span className="badge badge-serving">NOW SERVING</span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                      {currentServing.patient?.full_name}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleRecall}
                    className="btn btn-secondary btn-sm"
                    title="Repeat Audio Announcement"
                  >
                    <Volume2 size={16} color="#38bdf8" />
                    <span>Re-announce</span>
                  </button>
                </div>
              </div>

              {/* Patient Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid #334155',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>MRN</span>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {currentServing.patient?.mrn}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Age / Sex</span>
                  <div style={{ fontWeight: 600 }}>
                    {currentServing.patient?.age} yrs / {currentServing.patient?.gender}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {currentServing.patient?.phone}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Blood Group</span>
                  <div style={{ fontWeight: 700, color: '#f87171' }}>
                    {currentServing.patient?.blood_group || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Chief Complaint / Notes from Registration */}
              {currentServing.notes && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  marginBottom: '20px',
                  fontSize: '0.88rem'
                }}>
                  <strong style={{ color: '#38bdf8' }}>Reason for Visit / Complaint: </strong>
                  <span style={{ color: '#cbd5e1' }}>{currentServing.notes}</span>
                </div>
              )}

              {/* Doctor's Prescription & Clinical Summary */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Diagnosis & Prescription Summary (Saves to MySQL)
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter medical findings, prescription, dosage, and follow-up instructions..."
                  className="form-textarea"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              {/* Action Buttons: Complete Consultation or Call Next */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  onClick={() => handleSkipPatient(currentServing)}
                  className="btn btn-secondary"
                >
                  <RotateCcw size={16} color="#94a3b8" />
                  <span>Mark Skipped</span>
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleCompleteConsultation}
                    className="btn btn-success btn-lg"
                    style={{ padding: '12px 28px', fontWeight: 700 }}
                  >
                    <CheckCircle2 size={20} />
                    <span>Complete Consultation</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Idle Screen when no patient is in consultation */
            <div className="glass-card" style={{
              padding: '60px 40px',
              textAlign: 'center',
              borderRadius: '20px'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(2, 132, 199, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                color: '#38bdf8'
              }}>
                <UserCheck size={36} />
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                Ready for Next Patient
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 28px auto' }}>
                {waitingList.length > 0
                  ? `There are ${waitingList.length} patient(s) waiting in queue for ${activeDoctor?.name}.`
                  : 'Queue is currently empty for this room.'}
              </p>

              <button
                onClick={handleCallNext}
                disabled={waitingList.length === 0}
                className="btn btn-primary btn-lg"
                style={{ padding: '14px 36px', fontSize: '1.1rem', fontWeight: 800 }}
              >
                <Play size={20} fill="white" />
                <span>Call Next Patient</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: DOCTOR'S ASSIGNED WAITING LIST */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', height: 'fit-content' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            paddingBottom: '12px',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#fbbf24" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Patients in Queue ({waitingList.length})
              </h3>
            </div>

            <button
              onClick={handleCallNext}
              disabled={waitingList.length === 0}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 12px' }}
            >
              <Play size={13} fill="white" />
              <span>Call Next</span>
            </button>
          </div>

          {waitingList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {waitingList.map((ticket, index) => (
                <div
                  key={ticket.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', width: '20px' }}>
                      #{index + 1}
                    </span>
                    <span className="token-chip" style={{ background: '#0284c7', color: 'white' }}>
                      {ticket.token_number}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                        {ticket.patient?.full_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {ticket.patient?.age} yrs • {ticket.patient?.gender}
                      </div>
                    </div>
                  </div>

                  <span className={`badge badge-${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto', opacity: 0.7 }} />
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No waiting patients for this doctor</p>
            </div>
          )}

          {/* COMPLETED TODAY LIST */}
          {completedList.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                Completed Consultations ({completedList.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {completedList.map(cTicket => (
                  <div
                    key={cTicket.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
                        {cTicket.token_number}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>{cTicket.patient?.full_name}</span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      {cTicket.completed_time ? new Date(cTicket.completed_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
