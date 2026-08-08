import React, { useState } from 'react';
import {
  Settings, UserPlus, Stethoscope, Edit2, Trash2,
  Database, Server, ShieldCheck, CheckCircle2, X, PlusCircle, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function DoctorManagement({
  doctors,
  dbHealth,
  onRefresh,
  onNotify,
  onSeedData
}) {
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: 'General Medicine',
    room_number: 'Room 101',
    status: 'available',
    phone: '',
    email: '',
    max_daily_tokens: 40
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    specialization: 'General Medicine',
    room_number: 'Room 101',
    status: 'available',
    phone: '',
    email: '',
    max_daily_tokens: 40
  });

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.specialization || !formData.room_number) {
      onNotify('error', 'Validation Error', 'Name, Specialization and Room Number are required');
      return;
    }

    try {
      const newDoc = await api.createDoctor({
        name: formData.name,
        specialization: formData.specialization,
        room_number: formData.room_number,
        status: formData.status,
        phone: formData.phone || null,
        email: formData.email || null,
        max_daily_tokens: parseInt(formData.max_daily_tokens)
      });
      onNotify('success', 'Doctor Added', `${newDoc.name} assigned to ${newDoc.room_number} in MySQL.`);
      setShowAddDoctorModal(false);
      setFormData({
        name: '',
        specialization: 'General Medicine',
        room_number: 'Room 101',
        status: 'available',
        phone: '',
        email: '',
        max_daily_tokens: 40
      });
      onRefresh();
    } catch (err) {
      onNotify('error', 'Failed to Add Doctor', err.message);
    }
  };

  const handleEditDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.updateDoctor(editFormData.id, {
        name: editFormData.name,
        specialization: editFormData.specialization,
        room_number: editFormData.room_number,
        status: editFormData.status,
        phone: editFormData.phone || null,
        email: editFormData.email || null,
        max_daily_tokens: parseInt(editFormData.max_daily_tokens)
      });
      onNotify('success', 'Doctor Updated', `Doctor details updated in MySQL.`);
      setShowEditDoctorModal(false);
      onRefresh();
    } catch (err) {
      onNotify('error', 'Failed to Update Doctor', err.message);
    }
  };

  const handleDeleteDoctor = async (doctor) => {
    if (!window.confirm(`Are you sure you want to delete ${doctor.name}? This will remove their profile from MySQL.`)) {
      return;
    }
    try {
      await api.deleteDoctor(doctor.id);
      onNotify('success', 'Doctor Deleted', `${doctor.name} removed from MySQL database.`);
      onRefresh();
    } catch (err) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  const openEdit = (doc) => {
    setEditFormData({
      id: doc.id,
      name: doc.name,
      specialization: doc.specialization,
      room_number: doc.room_number,
      status: doc.status,
      phone: doc.phone || '',
      email: doc.email || '',
      max_daily_tokens: doc.max_daily_tokens || 40
    });
    setShowEditDoctorModal(true);
  };

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
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 20px rgba(13, 148, 136, 0.4)'
          }}>
            <Settings size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Administration & Clinic Doctors
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Manage medical staff, room allocations, token capacity, and local MySQL persistence
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onSeedData}
            className="btn btn-secondary"
            style={{ padding: '10px 18px' }}
          >
            <Sparkles size={16} color="#c084fc" />
            <span>Seed Demo Queue</span>
          </button>

          <button
            onClick={() => setShowAddDoctorModal(true)}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            <UserPlus size={18} />
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      {/* SYSTEM INFRASTRUCTURE HEALTH STATUS CARD */}
      <div className="glass-card" style={{
        padding: '22px 28px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(6, 78, 59, 0.2) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Local MySQL Database Engine
                </h3>
                <span className="badge badge-serving">CONNECTED</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                Host: <strong style={{ color: '#38bdf8' }}>{dbHealth?.host || 'localhost'}:{dbHealth?.port || 3306}</strong> •
                Database: <strong style={{ color: '#38bdf8' }}>{dbHealth?.database_name || 'clinic_queue'}</strong> •
                Driver: <strong style={{ color: '#38bdf8' }}>SQLAlchemy + PyMySQL</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Doctors</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {doctors?.length || 0}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Patients</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {dbHealth?.counts?.patients || 0}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Tickets</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {dbHealth?.counts?.queue_tickets || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOCTOR DIRECTORY TABLE */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#f8fafc' }}>
          Registered Doctors & Room Allocations
        </h3>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialization</th>
                <th>Room Allocation</th>
                <th>Status</th>
                <th>Daily Token Cap</th>
                <th>Contact</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors && doctors.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`status-dot ${doc.status}`} />
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{doc.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: '#cbd5e1' }}>{doc.specialization}</td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {doc.room_number}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${doc.status === 'available' ? 'badge-serving' : doc.status === 'busy' ? 'badge-urgent' : 'badge-skipped'}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {doc.max_daily_tokens} tokens/day
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {doc.phone || doc.email || 'None'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => openEdit(doc)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Doctor"
                        style={{ padding: '6px 10px' }}
                      >
                        <Edit2 size={14} color="#fbbf24" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc)}
                        className="btn btn-secondary btn-sm"
                        title="Delete Doctor"
                        style={{ padding: '6px 10px' }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD DOCTOR */}
      {showAddDoctorModal && (
        <div className="modal-overlay" onClick={() => setShowAddDoctorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New Clinic Doctor</h3>
              <button className="modal-close" onClick={() => setShowAddDoctorModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor}>
              <div className="form-group">
                <label className="form-label">Doctor Full Name (with Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Emily Watson"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Specialization / Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology, Pediatrics"
                    className="form-input"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 106"
                    className="form-input"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Availability Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy / In Consultation</option>
                    <option value="off_duty">Off Duty</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Daily Token Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    className="form-input"
                    value={formData.max_daily_tokens}
                    onChange={(e) => setFormData({ ...formData, max_daily_tokens: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="doctor@clinic.org"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddDoctorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DOCTOR */}
      {showEditDoctorModal && (
        <div className="modal-overlay" onClick={() => setShowEditDoctorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Doctor Profile</h3>
              <button className="modal-close" onClick={() => setShowEditDoctorModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditDoctor}>
              <div className="form-group">
                <label className="form-label">Doctor Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editFormData.specialization}
                    onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editFormData.room_number}
                    onChange={(e) => setEditFormData({ ...editFormData, room_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="off_duty">Off Duty</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Daily Token Limit</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editFormData.max_daily_tokens}
                    onChange={(e) => setEditFormData({ ...editFormData, max_daily_tokens: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditDoctorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
