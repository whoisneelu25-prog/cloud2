const BASE_URL = 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = Array.isArray(errorData.detail)
            ? errorData.detail.map(d => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(', ')
            : errorData.detail;
        }
      } catch (e) {
        // use fallback text
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // System & Health
  getHealth: () => request('/health'),
  getStats: () => request('/stats'),
  getLiveDisplay: () => request('/queue/display'),
  seedSampleData: () => request('/seed', { method: 'POST' }),

  // Patients
  getPatients: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    return request(`/patients?${query.toString()}`);
  },
  getPatientById: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePatient: (id, data) => request(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePatient: (id) => request(`/patients/${id}`, {
    method: 'DELETE',
  }),

  // Doctors
  getDoctors: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.specialization) query.append('specialization', params.specialization);
    return request(`/doctors?${query.toString()}`);
  },
  getDoctorById: (id) => request(`/doctors/${id}`),
  createDoctor: (data) => request('/doctors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDoctor: (id, data) => request(`/doctors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteDoctor: (id) => request(`/doctors/${id}`, {
    method: 'DELETE',
  }),

  // Queue Operations
  getQueue: (params = {}) => {
    const query = new URLSearchParams();
    if (params.doctor_id) query.append('doctor_id', params.doctor_id);
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    return request(`/queue?${query.toString()}`);
  },
  issueTicket: (data) => request('/queue/ticket', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  walkinRegistration: (data) => request('/queue/walkin', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  doctorCallNext: (doctorId) => request(`/queue/call-next/${doctorId}`, {
    method: 'POST',
  }),
  updateQueueTicketStatus: (ticketId, data) => request(`/queue/${ticketId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteQueueTicket: (ticketId) => request(`/queue/${ticketId}`, {
    method: 'DELETE',
  }),

  // Appointments
  getAppointments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.doctor_id) query.append('doctor_id', params.doctor_id);
    if (params.status) query.append('status', params.status);
    return request(`/appointments?${query.toString()}`);
  },
  createAppointment: (data) => request('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteAppointment: (id) => request(`/appointments/${id}`, {
    method: 'DELETE',
  }),
};
