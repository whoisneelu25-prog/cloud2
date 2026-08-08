import React, { useState, useEffect } from 'react';
import {
  Users, Search, UserPlus, Ticket, Eye, Edit2, Trash2,
  X, Check, AlertCircle, Phone, Mail, Droplet, User, HeartPulse
} from 'lucide-react';
import { api } from '../services/api';

export default function PatientRegistration({
  doctors,
  onNotify,
  onOpenWalkinWithPatient
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    blood_group: 'O+',
    emergency_contact: '',
    notes: '',
    auto_issue_token: true,
    doctor_id: '',
    priority: 'normal'
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    full_name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    blood_group: 'O+',
    emergency_contact: '',
    notes: ''
  });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients({ search: searchTerm });
      setPatients(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      onNotify('error', 'Failed to fetch patients', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.age || !formData.phone) {
      onNotify('error', 'Validation Error', 'Full Name, Age, and Phone number are required');
      return;
    }

    try {
      const payload = {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        blood_group: formData.blood_group || null,
        emergency_contact: formData.emergency_contact || null,
        notes: formData.notes || null
      };

      const newPatient = await api.createPatient(payload);
      onNotify('success', 'Patient Registered', `Patient ${newPatient.full_name} registered with MRN: ${newPatient.mrn}`);

      if (formData.auto_issue_token) {
        const ticket = await api.issueTicket({
          patient_id: newPatient.id,
          doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null,
          priority: formData.priority,
          notes: formData.notes || 'Walk-in Registration'
        });
        onNotify('success', 'Queue Token Issued', `Token ${ticket.token_number} generated for ${newPatient.full_name}`);
      }

      setShowAddModal(false);
      setFormData({
        full_name: '',
        age: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        blood_group: 'O+',
        emergency_contact: '',
        notes: '',
        auto_issue_token: true,
        doctor_id: '',
        priority: 'normal'
      });
      loadPatients();
    } catch (err) {
      onNotify('error', 'Registration Failed', err.message);
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    try {
      await api.updatePatient(editFormData.id, {
        full_name: editFormData.full_name,
        age: parseInt(editFormData.age),
        gender: editFormData.gender,
        phone: editFormData.phone,
        email: editFormData.email || null,
        address: editFormData.address || null,
        blood_group: editFormData.blood_group || null,
        emergency_contact: editFormData.emergency_contact || null,
        notes: editFormData.notes || null
      });

      onNotify('success', 'Patient Updated', `Record for ${editFormData.full_name} updated successfully in MySQL.`);
      setShowEditModal(false);
      loadPatients();
    } catch (err) {
      onNotify('error', 'Update Failed', err.message);
    }
  };

  const handleDeletePatient = async (patient) => {
    if (!window.confirm(`Are you sure you want to delete patient "${patient.full_name}" (${patient.mrn})? This will also remove their queue history.`)) {
      return;
    }

    try {
      await api.deletePatient(patient.id);
      onNotify('success', 'Patient Deleted', `Patient ${patient.full_name} removed from MySQL database.`);
      loadPatients();
    } catch (err) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  const openViewDetails = async (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
    try {
      const history = await api.getPatientById(patient.id);
      setPatientHistory(history);
    } catch (err) {
      onNotify('error', 'Failed to load patient history', err.message);
    }
  };

  const openEdit = (patient) => {
    setEditFormData({
      id: patient.id,
      full_name: patient.full_name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      blood_group: patient.blood_group || 'O+',
      emergency_contact: patient.emergency_contact || '',
      notes: patient.notes || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="page-wrapper">
      {/* Top Header & Search Bar */}
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
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Patient Directory & Registration
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Permanent Medical Records stored directly in local MySQL ({totalCount} total)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Instant Search Bar */}
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Name, MRN, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            <UserPlus size={18} />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Patient List Table Card */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>MRN</th>
                <th>Full Name</th>
                <th>Age / Gender</th>
                <th>Phone</th>
                <th>Blood Group</th>
                <th>Registered Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading patient records from MySQL...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No patient records found. Click "Register New Patient" to add one.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <span className="token-chip" style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '0.85rem' }}>
                        {patient.mrn}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{patient.full_name}</strong>
                      {patient.emergency_contact && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Emerg: {patient.emergency_contact}
                        </div>
                      )}
                    </td>
                    <td>
                      {patient.age} yrs • {patient.gender}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{patient.phone}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        {patient.blood_group || 'N/A'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => onOpenWalkinWithPatient(patient)}
                          className="btn btn-primary btn-sm"
                          title="Issue Queue Token"
                          style={{ padding: '6px 10px' }}
                        >
                          <Ticket size={14} />
                          <span>Queue</span>
                        </button>
                        <button
                          onClick={() => openViewDetails(patient)}
                          className="btn btn-secondary btn-sm"
                          title="View Details & History"
                          style={{ padding: '6px' }}
                        >
                          <Eye size={14} color="#38bdf8" />
                        </button>
                        <button
                          onClick={() => openEdit(patient)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Patient"
                          style={{ padding: '6px' }}
                        >
                          <Edit2 size={14} color="#fbbf24" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient)}
                          className="btn btn-secondary btn-sm"
                          title="Delete Patient"
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={14} color="#ef4444" />
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

      {/* MODAL: REGISTER NEW PATIENT */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <UserPlus size={20} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>New Patient Registration</h3>
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="form-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="130"
                    placeholder="e.g. 35"
                    className="form-input"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact Person</label>
                  <input
                    type="text"
                    placeholder="Name & Relationship (e.g. Spouse)"
                    className="form-input"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Medical Notes / Chief Complaint</label>
                <textarea
                  rows={2}
                  placeholder="Describe reason for visit or existing medical conditions..."
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Instant Token Issuance Option */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(2, 132, 199, 0.12)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                marginBottom: '20px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, color: '#38bdf8', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.auto_issue_token}
                    onChange={(e) => setFormData({ ...formData, auto_issue_token: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Automatically issue Live Queue Token immediately</span>
                </label>

                {formData.auto_issue_token && (
                  <div className="grid-2" style={{ marginTop: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Assign to Doctor</label>
                      <select
                        className="form-select"
                        value={formData.doctor_id}
                        onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                      >
                        <option value="">Any Available Doctor</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} - {d.specialization} ({d.room_number})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Priority Level</label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="normal">Normal Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="senior">Senior Citizen / VIP</option>
                        <option value="emergency">EMERGENCY (Immediate)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Save & Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PATIENT */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Patient Information</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditPatient}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={editFormData.blood_group}
                    onChange={(e) => setEditFormData({ ...editFormData, blood_group: e.target.value })}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.emergency_contact}
                  onChange={(e) => setEditFormData({ ...editFormData, emergency_contact: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical Notes</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
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

      {/* MODAL: VIEW DETAILS & VISIT HISTORY */}
      {showDetailModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedPatient.full_name}</h3>
                <span style={{ fontSize: '0.85rem', color: '#38bdf8' }}>MRN: {selectedPatient.mrn}</span>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Age / Gender</span>
                <strong>{selectedPatient.age} yrs • {selectedPatient.gender}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Phone</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedPatient.phone}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Blood Group</span>
                <strong style={{ color: '#f87171' }}>{selectedPatient.blood_group || 'N/A'}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px' }}>Visit & Queue History</h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patientHistory?.tickets && patientHistory.tickets.length > 0 ? (
                patientHistory.tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #334155'
                    }}
                  >
                    <div>
                      <span className="token-chip" style={{ background: '#0284c7', color: 'white', marginRight: '8px' }}>
                        {ticket.token_number}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {ticket.doctor?.name || 'General'} • {ticket.queue_date}
                      </span>
                      {ticket.prescription_summary && (
                        <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px' }}>
                          Rx: {ticket.prescription_summary}
                        </div>
                      )}
                    </div>
                    <span className={`badge badge-${ticket.status}`}>
                      {ticket.status}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  No past queue history for this patient.
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
