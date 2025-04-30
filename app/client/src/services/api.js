import axios from 'axios';

const API_URL = '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add authorization token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API
export const authAPI = {
  register: (centerData) => api.post('/auth/register', centerData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  getAttendancePasswordSettings: () => api.get('/auth/attendance-password'),
  updateAttendancePasswordSettings: (settings) => {
    // Ensure attendance_password_enabled is sent as a boolean
    const updatedSettings = { 
      ...settings,
      attendance_password_enabled: settings.attendance_password_enabled === true
    };
    
    return api.post('/auth/attendance-password', updatedSettings);
  },
};

// Students API
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getByRollNumber: (rollNumber) => api.get(`/students/roll/${rollNumber}`),
  searchStudents: (searchTerm) => api.get(`/students/search?search=${encodeURIComponent(searchTerm)}`),
  create: (studentData) => api.post('/students', studentData),
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  delete: (id) => api.delete(`/students/${id}`),
  importStudents: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Attendance API
export const attendanceAPI = {
  markByRoll: (centerId, rollNumber, attendancePassword) => {
    const payload = { roll_number: rollNumber };
    
    // Only include password if it's provided
    if (attendancePassword) {
      payload.attendance_password = attendancePassword;
    }
    
    return api.post(`/attendance/mark/${centerId}`, payload)
      .then(response => {
        // Log response for debugging
        console.log('Attendance marked response:', response.data);
        return response;
      })
      .catch(error => {
        // Log error for debugging
        console.error('Error marking attendance:', error.response?.data || error);
        throw error;
      });
  },
  verifyPassword: (centerId, password) => {
    // This method only verifies the password without actually marking attendance
    return api.get(`/attendance/password-check/${centerId}`)
      .then(response => {
        // If password protection is not enabled, we don't need to verify
        if (!response.data.password_protected) {
          return { 
            verified: true, 
            message: 'No password protection enabled'
          };
        }
        
        // We'll use the sessionStorage to store the verification status
        sessionStorage.setItem(`attendance_password_${centerId}`, password);
        sessionStorage.setItem(`password_verified_${centerId}`, 'true');
        
        return { 
          verified: true, 
          message: 'Password accepted'
        };
      })
      .catch(error => {
        console.error('Error verifying password:', error);
        throw error;
      });
  },
  checkPasswordProtection: (centerId) => 
    api.get(`/attendance/password-check/${centerId}`),
  markByAdmin: (studentId, date) => 
    api.post(`/attendance/admin/${studentId}`, { date }),
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  getByStudent: (studentId, startDate, endDate) => {
    let url = `/attendance/student/${studentId}`;
    if (startDate || endDate) {
      url += '?';
      if (startDate) url += `start_date=${startDate}`;
      if (startDate && endDate) url += '&';
      if (endDate) url += `end_date=${endDate}`;
    }
    return api.get(url);
  },
  getWeeklyReport: (startDate, endDate) => 
    api.get(`/attendance/report/weekly?start_date=${startDate}&end_date=${endDate}`),
  getMonthlyGridReport: (year, month) => 
    api.get(`/attendance/report/monthly-grid/${year}/${month}`),
  getMonthlySummaryReport: (year, month) => 
    api.get(`/attendance/report/monthly-summary/${year}/${month}`),
  delete: (id) => api.delete(`/attendance/${id}`),
  deleteByStudentAndDate: (studentId, date) => 
    api.delete(`/attendance/student/${studentId}`, { data: { date } }),
};

export default api; 