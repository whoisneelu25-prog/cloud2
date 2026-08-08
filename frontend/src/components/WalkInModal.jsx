import React, { useState, useEffect } from 'react';
import { Ticket, X, User, PlusCircle, Search, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function WalkInModal({
  isOpen,
  onClose,
  doctors,
  preselectedPatient,
  onNotify,
  onSuccess
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState(preselectedPatient ? 'existing' : 'new');
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatient?.id || '');
  const [patientSearch, setPatientSearch] = useState('');

  // New patient state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Token options
  const [doctorId, setDoctorId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatientId(preselectedPatient.id);
      setMode('existing');
    }
  }, [preselectedPatient]);

  useEffect(() => {
    if (mode === 'existing') {
      api.getPatients({ search: patientSearch, limit: 20 })
        .then(res => setExistingPatients(res.items || []))
        .catch(err => console.error(err));
    }
  }, [mode, patientSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let ticket;
      if (mode === 'existing') {
        if (!selectedPatientId) {
          onNotify('error', 'Select Patient', 'Please choose an existing patient from the list.');
          setSubmitting(false);
          return;
        }

        ticket = await api.issueTicket({
          patient_id: parseInt(selectedPatientId),
          doctor_id: doctorId ? parseInt(doctorId) : null,
          priority,
          notes: notes || 'Walk-in'
        });
      } else {
        if (!fullName || !age || !phone) {
          onNotify('error', 'Validation Error', 'Full Name, Age, and Phone are required.');
          setSubmitting(false);
          return;
        }

        ticket = await api.walkinRegistration({
          full_name: fullName,
          age: parseInt(age),
          gender,
          phone,
          blood_group: bloodGroup,
          doctor_id: doctorId ? parseInt(doctorId) : null,
          priority,
          notes: notes || 'Walk-in Registration'
        });
      }

      onNotify('success', 'Token Generated', `Token ${ticket.token_number} issued for ${ticket.patient?.full_name}`);
      onSuccess();
      onClose();
    } catch (err) {
      onNotify('error', 'Issuance Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Ticket size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Issue Live Queue Token</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Assign token number and place in doctor's waiting queue</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Patient Selection Toggle: Existing vs New */}
        {!preselectedPatient && (
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #334155'
          }}>
            <button
              type="button"
              onClick={() => setMode('new')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mode === 'new' ? '#0284c7' : 'transparent',
                color: mode === 'new' ? '#fff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              New Patient Walk-in
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mode === 'existing' ? '#0284c7' : 'transparent',
                color: mode === 'existing' ? '#fff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Select Existing Patient
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'existing' ? (
            <div className="form-group">
              <label className="form-label">Search & Select Patient *</label>
              {preselectedPatient ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(2, 132, 199, 0.15)',
                  border: '1px solid #0284c7',
                  color: '#f8fafc',
                  fontWeight: 600
                }}>
                  {preselectedPatient.full_name} ({preselectedPatient.mrn}) • {preselectedPatient.phone}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search name, phone or MRN..."
                    className="form-input"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  <select
                    className="form-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {existingPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.mrn}) - {p.phone}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="30"
                    className="form-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
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
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
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
            </>
          )}

          {/* Queue & Doctor Assignment */}
          <div className="grid-2" style={{ marginTop: '8px' }}>
            <div className="form-group">
              <label className="form-label">Assign to Doctor</label>
              <select
                className="form-select"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">Any Available Doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.room_number}) - {d.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal Priority</option>
                <option value="urgent">Urgent</option>
                <option value="senior">Senior Citizen / Special Care</option>
                <option value="emergency">EMERGENCY (Top of Queue)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Symptoms (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Headache and fever for 2 days..."
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              {submitting ? 'Generating...' : 'Issue Queue Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
