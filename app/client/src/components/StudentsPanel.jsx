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
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const [sortField, setSortField] = useState('roll_number'); // Default sort by roll number
  const [sortDirection, setSortDirection] = useState('asc'); // Default ascending
  
  useEffect(() => {
    fetchStudents();
  }, []);
  
  // Filter students whenever search query or students list changes
  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);
  
  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(query) || 
      student.roll_number.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
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
      const sortedStudents = sortStudents(studentsWithAttendance, sortField, sortDirection);
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (err) {
      setError('Failed to load students. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to sort students
  const sortStudents = (studentsArray, field, direction) => {
    return [...studentsArray].sort((a, b) => {
      // Handle numeric fields
      if (field === 'roll_number' || field === 'age') {
        const aValue = field === 'roll_number' ? parseInt(a[field], 10) : (a[field] || 0);
        const bValue = field === 'roll_number' ? parseInt(b[field], 10) : (b[field] || 0);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Handle boolean field (isPresentToday)
      else if (field === 'isPresentToday') {
        return direction === 'asc' 
          ? (a.isPresentToday === b.isPresentToday ? 0 : a.isPresentToday ? -1 : 1)
          : (a.isPresentToday === b.isPresentToday ? 0 : a.isPresentToday ? 1 : -1);
      }
      // Handle string fields (name, gender, type)
      else {
        const aValue = (a[field] || '').toLowerCase();
        const bValue = (b[field] || '').toLowerCase();
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
  };
  
  // Handle table header click for sorting
  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    const sorted = sortStudents(students, field, newDirection);
    setStudents(sorted);
    
    // Apply filtering again to maintain search results
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      setFilteredStudents(sorted.filter(student => 
        student.name.toLowerCase().includes(query) || 
        student.roll_number.toLowerCase().includes(query)
      ));
    } else {
      setFilteredStudents(sorted);
    }
  };
  
  // Render sort icon
  const renderSortIcon = (field) => {
    if (field !== sortField) {
      return <span className="ms-1 text-muted">↕</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="ms-1">↑</span>
      : <span className="ms-1">↓</span>;
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
        // If student is already marked present, remove the attendance
        await attendanceAPI.deleteByStudentAndDate(student.id, today);
        // Update local state
        const updatedStudents = students.map(s => 
          s.id === student.id ? { ...s, isPresentToday: false } : s
        );
        const sorted = sortStudents(updatedStudents, sortField, sortDirection);
        setStudents(sorted);
        // Reapply filtering
        filterStudents();
      } else {
        // Mark student as present
        await attendanceAPI.markByAdmin(student.id, today);
        // Update local state
        const updatedStudents = students.map(s => 
          s.id === student.id ? { ...s, isPresentToday: true } : s
        );
        const sorted = sortStudents(updatedStudents, sortField, sortDirection);
        setStudents(sorted);
        // Reapply filtering
        filterStudents();
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
        <>
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              {searchQuery && (
                <button 
                  className="btn btn-outline-secondary" 
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
            </div>
            {filteredStudents.length < students.length && (
              <small className="text-muted">
                Showing {filteredStudents.length} of {students.length} students
              </small>
            )}
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="alert alert-info">No students match your search query.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('roll_number')}>
                      Roll {renderSortIcon('roll_number')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                      Name {renderSortIcon('name')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('type')}>
                      Type {renderSortIcon('type')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('gender')}>
                      Gender {renderSortIcon('gender')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('age')}>
                      Age {renderSortIcon('age')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('isPresentToday')}>
                      Present Today {renderSortIcon('isPresentToday')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
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
        </>
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
            onChange={(e) => {
              // Only allow numbers and limit to 3 digits
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 3) {
                setFormData({
                  ...formData,
                  roll_number: value
                });
              }
            }}
            maxLength="3"
            pattern="[0-9]{1,3}"
            placeholder="Leave empty for auto-assignment"
          />
          <div className="form-text">
            Leave empty to auto-assign a 3-digit roll number, or enter a 3-digit roll number (001-999)
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
  const [attendance, setAttendance] = useState([]); // Store only attendance records
  const [allCellsInMonth, setAllCellsInMonth] = useState([]); // Store all cells (padding + days) for the selected month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for selected year and month number
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonthNum, setSelectedMonthNum] = useState(() => new Date().getMonth() + 1); // 1-12
  
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  
  // Derived selectedMonth string (YYYY-MM) for consistency if needed elsewhere
  const selectedMonthYYYYMM = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`;
  
  // Fetch attendance when component mounts or selected month/year changes
  useEffect(() => {
    if (params.id && selectedYear && selectedMonthNum) {
      fetchStudentAttendanceForMonth(params.id, selectedYear, selectedMonthNum);
    }
  }, [params.id, selectedYear, selectedMonthNum]);
  
  // Generate all cells (padding + dates) for the selected month and map attendance status
  useEffect(() => {
    if (selectedYear && selectedMonthNum) {
      const year = selectedYear;
      const month = selectedMonthNum; // Month is 1-based here
      const firstDayOfMonth = new Date(year, month - 1, 1);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const startDayOfWeek = firstDayOfMonth.getDay(); 
      const cellsArray = [];
      const presentDates = new Set(attendance.map(a => a.date));
      
      for (let i = 0; i < startDayOfWeek; i++) {
        cellsArray.push({ isPadding: true, key: `pad-start-${i}` });
      }
      
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month - 1, i);
        // Ensure dateString is always in YYYY-MM-DD format, regardless of timezone
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        cellsArray.push({
          date: dateString,
          dayOfMonth: i,
          isPresent: presentDates.has(dateString),
          isPadding: false,
          key: dateString 
        });
      }
      
      setAllCellsInMonth(cellsArray);
    }
  }, [selectedYear, selectedMonthNum, attendance]);
  
  const fetchStudentAttendanceForMonth = async (studentId, year, month) => {
    setLoading(true);
    setError('');
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    // Calculate end date correctly using Date object
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; 
    
    try {
      if (!student) {
        const studentRes = await studentsAPI.getById(studentId);
        setStudent(studentRes.data.student);
      }
      
      const response = await attendanceAPI.getByStudent(studentId, startDate, endDate);
      setAttendance(response.data.attendance);
    } catch (err) {
      setError('Failed to load attendance data. Please try again.');
      console.error(err);
      setAttendance([]); 
      setAllCellsInMonth([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers for year and month dropdowns
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value, 10));
  };
  
  const handleMonthNumChange = (e) => {
    setSelectedMonthNum(parseInt(e.target.value, 10));
  };
  
  const handleToggleAttendance = async (date) => {
    if (!date) return; // Prevent action on padding cells
    try {
      setError(''); // Clear previous errors
      const isPresent = attendance.some(a => a.date === date);
      
      // Optimistic UI Update
      setAttendance(prevAttendance => 
        isPresent 
          ? prevAttendance.filter(a => a.date !== date)
          : [...prevAttendance, { date: date, id: `temp-${Date.now()}` }] // Add temporary record
      );
      
      // API Call
      if (isPresent) {
        await attendanceAPI.deleteByStudentAndDate(params.id, date);
      } else {
        await attendanceAPI.markByAdmin(params.id, date);
      }
      
    } catch (err) {
      setError('Failed to update attendance. Please try again.');
      console.error(err);
      // Revert Optimistic UI on Error
      setAttendance(prevAttendance => {
        const isPresentAfterAttempt = prevAttendance.some(a => a.date === date);
        if (isPresent === isPresentAfterAttempt) { // Error occurred, need to revert
          return isPresent 
            ? [...prevAttendance, { date: date, id: `revert-${Date.now()}` }] // Add back if delete failed
            : prevAttendance.filter(a => a.date !== date); // Remove if add failed
        }
        return prevAttendance; // State was already correct
      });
    }
  };
  
  const formatDateForDisplay = (dateString, options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!dateString) return '';
    try {
      // Create date assuming UTC to avoid timezone shifts affecting the date part
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day)); 
      return date.toLocaleDateString(undefined, options);
    } catch (e) { 
      console.error("Error formatting date:", dateString, e);
      return dateString; 
    }
  };
  
  // Prepare data for views
  const monthName = selectedYear && selectedMonthNum ? formatDateForDisplay(`${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}-01`, { month: 'long', year: 'numeric' }) : '';
  const actualDaysInMonth = allCellsInMonth.filter(cell => !cell.isPadding);
  const presentCount = actualDaysInMonth.filter(d => d.isPresent).length;
  const totalDaysShown = actualDaysInMonth.length;
  const attendancePercentage = totalDaysShown > 0 ? Math.round((presentCount / totalDaysShown) * 100) : 0;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate year options for dropdown
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  // Month options for dropdown
  const monthOptions = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  if (loading && !student) {
    return <div className="text-center p-5">Loading student data...</div>;
  }
  
  return (
    <div>
      {/* Header & Error */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>
          {student ? `Attendance for ${student.name} (${student.roll_number})` : 'Student Attendance'}
        </h3>
        <Link to="/dashboard/students" className="btn btn-secondary btn-sm">
          Back to Students
        </Link>
      </div>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}
      
      {/* Filter Card */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Select Month & View</h5>
          {/* View Toggle Buttons */}
          <div className="btn-group">
            <button 
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/></svg>
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-2-4A.5.5 0 0 1 3.5 7h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-2-4A.5.5 0 0 1 1.5 3h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5"/></svg>
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Year and Month Select Dropdowns */}
          <div className="row g-3 align-items-end">
            <div className="col-md-3 col-6">
              <label htmlFor="yearSelector" className="form-label">Year</label>
              <select 
                id="yearSelector" 
                className="form-select" 
                value={selectedYear} 
                onChange={handleYearChange}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 col-6">
              <label htmlFor="monthSelector" className="form-label">Month</label>
              <select 
                id="monthSelector" 
                className="form-select" 
                value={selectedMonthNum} 
                onChange={handleMonthNumChange}
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance Display Area */}
      {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading attendance...</span>
            </div>
          </div>
      ) : !student ? (
         <div className="alert alert-warning">Could not load student details.</div>
      ) : totalDaysShown === 0 && !loading ? (
        <div className="alert alert-warning">
          No attendance data available for {monthName}. Select a different month.
        </div>
      ) : (
        <div>
          <div className="alert alert-secondary mb-4">
            <strong>Attendance for {monthName}:</strong> {presentCount} days present out of {totalDaysShown} days ({attendancePercentage}%)
          </div>
          
          {viewMode === 'calendar' ? (
            // --- Calendar View --- 
            <div className="mb-4">
              <div className="calendar-container">
                {/* Day Labels */}
                <div className="calendar-grid day-labels">
                  {dayLabels.map(label => (
                    <div key={label} className="day-label">{label}</div>
                  ))}
                </div>
                {/* Calendar Days */}
                <div className="calendar-grid">
                  {allCellsInMonth.map(cell => 
                    cell.isPadding ? (
                      <div key={cell.key} className="calendar-day padding"></div>
                    ) : (
                      <div 
                        key={cell.key} 
                        className={`calendar-day ${cell.isPresent ? 'present' : 'absent'}`}
                        onClick={() => handleToggleAttendance(cell.date)}
                        // Use formatDateForDisplay for the tooltip to ensure correctness
                        title={`${formatDateForDisplay(cell.date)} - Click to ${cell.isPresent ? 'Mark Absent' : 'Mark Present'}`}
                      >
                        <div className="date-number">
                          {cell.dayOfMonth}
                        </div>
                        <div className={`status-indicator ${cell.isPresent ? 'present' : 'absent'}`}></div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            // --- List View --- 
            <div className="table-responsive">
              <table className="table table-striped table-hover table-sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Ensure list view uses and sorts actualDaysInMonth */} 
                  {[...actualDaysInMonth].sort((a, b) => new Date(b.date) - new Date(a.date)).map((day, index) => (
                    <tr key={day.date} className={day.isPresent ? 'table-light' : ''}>
                      <td>{index + 1}</td>
                      {/* Use formatDateForDisplay here as well */}
                      <td>{formatDateForDisplay(day.date)}</td>
                      <td>
                        <span className={`badge ${day.isPresent ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                          {day.isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`btn btn-sm ${day.isPresent ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggleAttendance(day.date)}
                          title={day.isPresent ? 'Mark Absent' : 'Mark Present'}
                        >
                          {day.isPresent ? 'Set Absent' : 'Set Present'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Embedded Styles */}
      <style jsx>{`
        .calendar-container {
          margin-top: 0.5rem; /* Reduced margin */
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr); /* Always 7 columns */
          gap: 6px; /* Slightly reduced gap */
        }
        .calendar-grid.day-labels {
          margin-bottom: 8px; /* Space between labels and days */
          gap: 6px; 
        }
        .day-label {
          text-align: center;
          font-weight: bold;
          color: #6c757d; /* Bootstrap secondary color */
          font-size: 0.85rem;
          padding-bottom: 4px;
        }
        .calendar-day {
          border: 1px solid #e0e0e0;
          border-radius: 4px; /* Slightly less rounded */
          padding: 6px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, background-color 0.15s ease-out;
          position: relative; 
          height: 60px; /* Slightly smaller height */
          display: flex;
          flex-direction: column;
          justify-content: center; /* Center content vertically */
          align-items: center; /* Center content horizontally */
          background-color: #f8f9fa; 
        }
        .calendar-day:not(.padding):hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.08);
        }
        .calendar-day.present {
          background-color: #e9f5e9; 
          border-color: #c8e6c9;
        }
        .calendar-day.absent {
          background-color: #ffebee; 
          border-color: #ffcdd2;
        }
        .calendar-day.padding {
          background-color: #f8f9fa; /* Same as default day */
          border-color: transparent; /* Make border invisible */
          cursor: default;
          opacity: 0.5; /* Make padding visually less prominent */
        }
        .date-number {
          font-size: 0.95rem; 
          font-weight: 500;
          color: #333;
          line-height: 1; /* Ensure number doesn't take too much space */
          /* Removed margin-top and align-self */
        }
        .status-indicator {
          width: 8px; /* Smaller indicator */
          height: 8px;
          border-radius: 50%;
          position: absolute;
          bottom: 5px; /* Adjust position */
          right: 5px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .status-indicator.present {
          background-color: #4CAF50; 
        }
        .status-indicator.absent {
          background-color: #F44336; 
        }
        /* Hide indicator in padding cells */
        .calendar-day.padding .status-indicator {
          display: none;
        }
        /* Hide date number in padding cells */
        .calendar-day.padding .date-number {
           visibility: hidden; 
        }
      `}</style>
    </div>
  );
};

export default StudentsPanel; 