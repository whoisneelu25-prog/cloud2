import React, { useState, useEffect } from 'react';
import {
  ListOrdered, PlusCircle, Filter, Search, Play, CheckCircle2,
  RotateCcw, Trash2, AlertTriangle, ArrowUpCircle, Clock, Stethoscope
} from 'lucide-react';
import { api } from '../services/api';
import { announceToken } from '../utils/audio';

export default function ReceptionQueueManager({
  doctors,
  onNotify,
  onOpenWalkin,
  onRefreshStats
}) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDoctor !== 'all') params.doctor_id = selectedDoctor;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      const data = await api.getQueue(params);
      setQueue(data);
    } catch (err) {
      onNotify('error', 'Failed to fetch queue', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedDoctor, selectedStatus]);

  const handleUpdateStatus = async (ticket, newStatus) => {
    try {
      await api.updateQueueTicketStatus(ticket.id, {
        status: newStatus,
        doctor_id: ticket.doctor_id
      });
      onNotify('success', 'Status Updated', `Token ${ticket.token_number} set to ${newStatus}`);
      if (newStatus === 'serving') {
        announceToken(ticket.token_number, `${ticket.doctor?.room_number || 'Room'}`);
      }
      loadQueue();
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Status Update Failed', err.message);
    }
  };

  const handleRequeue = async (ticket) => {
    try {
      await api.updateQueueTicketStatus(ticket.id, {
        status: 'waiting'
      });
      onNotify('success', 'Re-queued', `Token ${ticket.token_number} returned to waiting queue.`);
      loadQueue();
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Re-queue Failed', err.message);
    }
  };

  const handleDeleteTicket = async (ticket) => {
    if (!window.confirm(`Cancel queue token ${ticket.token_number} for ${ticket.patient?.full_name}?`)) {
      return;
    }
    try {
      await api.deleteQueueTicket(ticket.id);
      onNotify('success', 'Token Cancelled', `Token ${ticket.token_number} removed from queue.`);
      loadQueue();
      onRefreshStats();
    } catch (err) {
      onNotify('error', 'Action Failed', err.message);
    }
  };

  // Filter queue by search term (Patient name or Token number or MRN)
  const filteredQueue = queue.filter(t => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      t.token_number?.toLowerCase().includes(s) ||
      t.patient?.full_name?.toLowerCase().includes(s) ||
      t.patient?.mrn?.toLowerCase().includes(s) ||
      t.patient?.phone?.includes(s)
    );
  });

  return (
    <div className="page-wrapper">
      {/* Top Header */}
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
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)'
          }}>
            <ListOrdered size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Reception Desk Queue Controller
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Manage, re-order, call, skip, and adjust queue tickets in real time
            </p>
          </div>
        </div>

        <button
          onClick={onOpenWalkin}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontWeight: 700 }}
        >
          <PlusCircle size={18} />
          <span>New Walk-in Ticket</span>
        </button>
      </div>

      {/* Filter Toolbar Card */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Filter by token or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '0.88rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status:</span>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting Only</option>
              <option value="serving">Serving</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Doctor:</span>
            <select
              className="form-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}
            >
              <option value="all">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.room_number})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadQueue}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px 14px' }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Details</th>
                <th>Assigned Doctor & Room</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Wait Est.</th>
                <th>Issued Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading queue tickets from MySQL...
                  </td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No queue tickets matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <span
                        className="token-chip"
                        style={{
                          background: ticket.status === 'serving' ? '#10b981' : '#0284c7',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: 800
                        }}
                      >
                        {ticket.token_number}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
                        {ticket.patient?.full_name}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        MRN: {ticket.patient?.mrn} • {ticket.patient?.age}y ({ticket.patient?.gender})
                      </div>
                    </td>
                    <td>
                      {ticket.doctor ? (
                        <div>
                          <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{ticket.doctor.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{ticket.doctor.room_number}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Any Available Doctor
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.priority}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.status}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {ticket.status === 'completed'
                        ? 'Done'
                        : `~${ticket.estimated_wait_minutes} min`}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(ticket.issue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {ticket.status === 'waiting' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket, 'serving')}
                            className="btn btn-success btn-sm"
                            title="Call Patient into Room"
                            style={{ padding: '5px 10px' }}
                          >
                            <Play size={13} fill="white" />
                            <span>Call</span>
                          </button>
                        )}

                        {ticket.status === 'serving' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket, 'completed')}
                            className="btn btn-primary btn-sm"
                            title="Mark Completed"
                            style={{ padding: '5px 10px' }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Complete</span>
                          </button>
                        )}

                        {(ticket.status === 'serving' || ticket.status === 'waiting') && (
                          <button
                            onClick={() => handleUpdateStatus(ticket, 'skipped')}
                            className="btn btn-secondary btn-sm"
                            title="Skip Patient"
                            style={{ padding: '5px 8px' }}
                          >
                            <RotateCcw size={13} color="#f59e0b" />
                          </button>
                        )}

                        {(ticket.status === 'skipped' || ticket.status === 'completed') && (
                          <button
                            onClick={() => handleRequeue(ticket)}
                            className="btn btn-secondary btn-sm"
                            title="Re-queue Patient"
                            style={{ padding: '5px 8px' }}
                          >
                            <ArrowUpCircle size={13} color="#38bdf8" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTicket(ticket)}
                          className="btn btn-secondary btn-sm"
                          title="Cancel/Delete Ticket"
                          style={{ padding: '5px 8px' }}
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
