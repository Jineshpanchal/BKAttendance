import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { studentsAPI, attendanceAPI } from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const StudentsPanel = () => {
  return (
    <div>
      <h2 className="mb-4">Manage Students</h2>
      
      <Routes>
        <Route path="/" element={<StudentsList />} />
        <Route path="/add" element={<AddEditStudent />} />
        <Route path="/edit/:id" element={<AddEditStudent />} />
        <Route path="/attendance/:id" element={<StudentAttendance />} />
      </Routes>
    </div>
  );
};

// --- Student Import Component ---
const StudentImport = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadResult(null); // Clear previous results
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ error: 'Please select an Excel file to upload.' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await studentsAPI.importStudents(selectedFile);
      setUploadResult({
        success: true,
        message: response.data.message,
        details: response.data.results
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
      }
      onImportComplete(); // Refresh the student list
    } catch (err) {
      console.error('Import error:', err.response?.data || err);
      setUploadResult({
        error: true,
        message: err.response?.data?.message || 'An error occurred during import.',
        details: err.response?.data?.results
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      { roll_number: '101', name: 'Alice Smith', type: 'Kumari', gender: 'Female', age: 20 },
      { roll_number: '102', name: 'Bob Johnson', type: 'Kumar', gender: 'Male', age: 22 },
    ];
    const headers = ['roll_number', 'name', 'type', 'gender', 'age']; // Ensure correct order
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, 'student_import_sample.xlsx');
  };

  return (
    <div className="card mb-4">
      <div className="card-header">Import Students from Excel</div>
      <div className="card-body">
        <p>
          Upload an Excel (.xlsx) file with columns: <code>roll_number</code> (3 digits, required), <code>name</code> (required), <code>type</code> (required: Kumar, Kumari, Adhar Kumar, Adhar Kumari, Mata), <code>gender</code> (optional), <code>age</code> (optional).
        </p>
        <button onClick={handleDownloadSample} className="btn btn-secondary btn-sm me-2">
          Download Sample File
        </button>
        <hr />
        <div className="mb-3">
          <label htmlFor="studentFile" className="form-label">Select Excel File</label>
          <input 
            type="file" 
            className="form-control" 
            id="studentFile"
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept=".xlsx"
            disabled={uploading}
          />
        </div>
        <button onClick={handleUpload} className="btn btn-info" disabled={!selectedFile || uploading}>
          {uploading ? 'Uploading...' : 'Upload and Import'}
        </button>
        
        {/* Upload Results */}
        {uploadResult && (
          <div className={`alert mt-3 ${uploadResult.error ? 'alert-danger' : 'alert-success'}`}>
            <p><strong>{uploadResult.message}</strong></p>
            {uploadResult.details && uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
              <div>
                <h6>Errors:</h6>
                <ul style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.9em' }}>
                  {uploadResult.details.errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Component to display the list of students
const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  useEffect(() => {
    fetchStudents();
  }, []);
  
  const fetchStudents = async () => {
    setLoading(true);
    setError(''); // Clear error before fetching
    try {
      const response = await studentsAPI.getAll();
      // Check which students are present today
      const studentsWithAttendance = await Promise.all(
        response.data.students.map(async (student) => {
          try {
            const attendanceRes = await attendanceAPI.getByStudent(student.id, today, today);
            // If there's an attendance record for today, mark as present
            return {
              ...student,
              isPresentToday: attendanceRes.data.attendance.length > 0
            };
          } catch (err) {
            console.error(`Error fetching attendance for student ${student.id}:`, err);
            return {
              ...student,
              isPresentToday: false
            };
          }
        })
      );
      setStudents(studentsWithAttendance);
    } catch (err) {
      setError('Failed to load students. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      await studentsAPI.delete(id);
      fetchStudents(); // Refresh list after delete
    } catch (err) {
      setError('Failed to delete student. Please try again.');
      console.error(err);
    }
  };
  
  const handleToggleAttendance = async (student) => {
    try {
      if (student.isPresentToday) {
        // If student is already marked present, we need to remove the attendance
        // This might require a new API endpoint to remove attendance
        alert('Attendance removal is not supported yet. Please contact the administrator.');
      } else {
        // Mark student as present
        await attendanceAPI.markByAdmin(student.id, today);
        // Update local state
        setStudents(prevStudents => 
          prevStudents.map(s => 
            s.id === student.id ? { ...s, isPresentToday: true } : s
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance');
    }
  };
  
  if (loading && students.length === 0) { // Show loading only on initial load
    return <div>Loading students...</div>;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/dashboard/students/add" className="btn btn-primary me-2 mb-2">
            Add New Student
          </Link>
          <StudentImport onImportComplete={fetchStudents} />
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {students.length === 0 ? (
        <div className="alert alert-info">No students found. Add your first student!</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Name</th>
                <th>Type</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Present Today</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.roll_number}</td>
                  <td>{student.name}</td>
                  <td>{student.type || '-'}</td>
                  <td>{student.gender || '-'}</td>
                  <td>{student.age || '-'}</td>
                  <td className="text-center">
                    <div className="form-check d-inline-block">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={student.isPresentToday}
                        onChange={() => handleToggleAttendance(student)}
                        id={`attendance-${student.id}`}
                      />
                      <label 
                        className="form-check-label" 
                        htmlFor={`attendance-${student.id}`}
                        style={{ cursor: "pointer" }}
                      >
                        {student.isPresentToday ? 'Present' : 'Absent'}
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link 
                        to={`/dashboard/students/attendance/${student.id}`}
                        className="btn btn-outline-info"
                        title="View attendance history"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 11a1 1 0 1 1 0-2h8a1 1 0 1 1 0 2H4zm0-4a1 1 0 1 1 0-2h8a1 1 0 1 1 0 2H4zm0-4a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2H4z"/>
                        </svg>
                      </Link>
                      <Link 
                        to={`/dashboard/students/edit/${student.id}`}
                        className="btn btn-outline-warning"
                        title="Edit student"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                      </Link>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteStudent(student.id)}
                        title="Delete student"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Component for adding or editing a student
const AddEditStudent = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    roll_number: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  
  useEffect(() => {
    if (params.id) {
      setIsEdit(true);
      fetchStudent(params.id);
    }
  }, [params.id]);
  
  const fetchStudent = async (id) => {
    setLoading(true);
    try {
      const response = await studentsAPI.getById(id);
      const student = response.data.student;
      setFormData({
        name: student.name,
        gender: student.gender || '',
        age: student.age || '',
        roll_number: student.roll_number,
        type: student.type || ''
      });
    } catch (err) {
      setError('Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isEdit) {
        await studentsAPI.update(params.id, formData);
      } else {
        await studentsAPI.create(formData);
      }
      navigate('/dashboard/students');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to save student. Please check your data and try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{isEdit ? 'Edit Student' : 'Add New Student'}</h3>
        <Link to="/dashboard/students" className="btn btn-secondary">
          Back to Students
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="gender" className="form-label">Gender</label>
          <select
            className="form-select"
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="type" className="form-label">Type</label>
          <select
            className="form-select"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="Kumar">Kumar</option>
            <option value="Kumari">Kumari</option>
            <option value="Adhar Kumar">Adhar Kumar</option>
            <option value="Adhar Kumari">Adhar Kumari</option>
            <option value="Mata">Mata</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="age" className="form-label">Age</label>
          <input
            type="number"
            className="form-control"
            id="age"
            name="age"
            min="1"
            max="120"
            value={formData.age}
            onChange={handleChange}
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="roll_number" className="form-label">Roll Number</label>
          <input
            type="text"
            className="form-control"
            id="roll_number"
            name="roll_number"
            value={formData.roll_number}
            onChange={handleChange}
            placeholder="Leave empty for auto-assignment"
          />
          <div className="form-text">
            Leave empty to auto-assign a 3-digit roll number, or enter custom roll number
          </div>
        </div>
        
        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
          <Link to="/dashboard/students" className="btn btn-secondary me-md-2">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for viewing student attendance
const StudentAttendance = () => {
  const params = useParams();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  useEffect(() => {
    if (params.id) {
      fetchStudentAttendance(params.id);
    }
  }, [params.id]);
  
  const fetchStudentAttendance = async (studentId, startDate = '', endDate = '') => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getByStudent(studentId, startDate, endDate);
      setStudent(response.data.student);
      setAttendance(response.data.attendance);
    } catch (err) {
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };
  
  const handleFilterAttendance = () => {
    if (params.id) {
      fetchStudentAttendance(params.id, dateRange.startDate, dateRange.endDate);
    }
  };
  
  if (loading) {
    return <div>Loading attendance data...</div>;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>
          {student ? `Attendance for ${student.name} (${student.roll_number})` : 'Student Attendance'}
        </h3>
        <Link to="/dashboard/students" className="btn btn-secondary">
          Back to Students
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="card mb-4">
        <div className="card-header">
          <h5>Filter Attendance</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={handleFilterAttendance}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {attendance.length === 0 ? (
        <div className="alert alert-info">
          No attendance records found for this student in the selected date range.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>
                  <td>{record.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="alert alert-info">
            Total days present: {attendance.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPanel; 