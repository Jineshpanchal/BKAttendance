import React, { useState, useEffect } from 'react';
import { attendanceAPI, studentsAPI } from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ReportsPanel = () => {
  const [reportType, setReportType] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Report data states
  const [dailyData, setDailyData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlySummaryData, setMonthlySummaryData] = useState(null);
  const [monthlyGridData, setMonthlyGridData] = useState(null);
  
  // Form states
  const [dailyForm, setDailyForm] = useState({ date: new Date().toISOString().split('T')[0] });
  const [studentForm, setStudentForm] = useState({ searchTerm: '' });
  const [weeklyForm, setWeeklyForm] = useState({ startDate: '', endDate: '' });
  const [monthlyForm, setMonthlyForm] = useState({
    year: new Date().getFullYear(),
    month: String(new Date().getMonth() + 1).padStart(2, '0')
  });
  
  // Search results state
  const [searchResults, setSearchResults] = useState([]);
  
  // Handlers for form changes
  const handleDailyChange = (e) => setDailyForm({ ...dailyForm, [e.target.name]: e.target.value });
  const handleStudentChange = (e) => setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  const handleWeeklyChange = (e) => setWeeklyForm({ ...weeklyForm, [e.target.name]: e.target.value });
  const handleMonthlyChange = (e) => setMonthlyForm({ ...monthlyForm, [e.target.name]: e.target.value });

  // --- Clear Data Helper ---
  const clearReportData = () => {
    setDailyData(null);
    setStudentData(null);
    setWeeklyData(null);
    setMonthlySummaryData(null);
    setMonthlyGridData(null);
    setSearchResults([]);
    setError('');
  };

  // --- Fetchers for report data ---
  const fetchDailyReport = async () => {
    setLoading(true); 
    setError(''); 
    clearReportData();
    try {
      const response = await attendanceAPI.getByDate(dailyForm.date);
      setDailyData(response.data);
    } catch (err) { 
      setError('Failed to fetch daily report.'); 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, []);

  const fetchStudentReport = async (studentId) => {
    setLoading(true);
    setError('');
    clearReportData();
    try {
      const attendanceRes = await attendanceAPI.getByStudent(studentId);
      setStudentData(attendanceRes.data);
    } catch (err) {
      setError('Failed to fetch student report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSearch = async () => {
    if (!studentForm.searchTerm) {
      setError('Please enter a roll number or name to search.');
      return;
    }
    setLoading(true);
    setError('');
    setSearchResults([]);
    clearReportData();
    try {
      const response = await studentsAPI.searchStudents(studentForm.searchTerm);
      setSearchResults(response.data.students);
      if (response.data.students.length === 0) {
        setError('No students found matching your search.');
      }
    } catch (err) {
      setError('Failed to search students.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    if (!weeklyForm.startDate || !weeklyForm.endDate) { 
      setError('Please select start and end dates.'); 
      return; 
    }
    setLoading(true); 
    setError(''); 
    clearReportData();
    try {
      const response = await attendanceAPI.getWeeklyReport(weeklyForm.startDate, weeklyForm.endDate);
      setWeeklyData(response.data);
    } catch (err) { 
      setError('Failed to fetch weekly report.'); 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchMonthlySummaryReport = async () => {
    setLoading(true); 
    setError(''); 
    clearReportData();
    try {
      const response = await attendanceAPI.getMonthlySummaryReport(monthlyForm.year, monthlyForm.month);
      setMonthlySummaryData(response.data);
    } catch (err) { 
      setError('Failed to fetch monthly summary.'); 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchMonthlyGridReport = async () => {
    setLoading(true); 
    setError(''); 
    clearReportData();
    try {
      const response = await attendanceAPI.getMonthlyGridReport(monthlyForm.year, monthlyForm.month);
      setMonthlyGridData(response.data);
    } catch (err) { 
      setError('Failed to fetch monthly grid.'); 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- Excel Export Functions ---
  const exportToExcel = (data, fileName, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  const handleExportDaily = () => {
    if (!dailyData || !dailyData.attendance || dailyData.attendance.length === 0) { alert('No data to export.'); return; }
    const dataToExport = dailyData.attendance.map(item => ({
      'Roll Number': item.roll_number,
      'Name': item.name,
      'Type': item.type,
      'Gender': item.gender,
      'Age': item.age
    }));
    exportToExcel(dataToExport, `Daily_Report_${dailyData.date}`, 'Daily');
  };
  
  const handleExportStudent = () => {
      if (!studentData || !studentData.attendance || studentData.attendance.length === 0) { alert('No data to export.'); return; }
      const dataToExport = studentData.attendance.map(item => ({ 'Date': item.date }));
      exportToExcel(dataToExport, `Student_Report_${studentData.student.roll_number}`, 'Attendance');
  };

  const handleExportWeekly = () => {
    if (!weeklyData || !weeklyData.report || weeklyData.report.length === 0) { alert('No data to export.'); return; }
    const dataToExport = weeklyData.report.map(item => ({
      'Roll Number': item.roll_number,
      'Name': item.name,
      'Type': item.type,
      'Present': item.days_present,
      'Total': item.total_days
    }));
    exportToExcel(dataToExport, `Weekly_Report_${weeklyData.start_date}_to_${weeklyData.end_date}`, 'Weekly');
  };

  const handleExportMonthlySummary = () => {
    if (!monthlySummaryData || !monthlySummaryData.summary || monthlySummaryData.summary.length === 0) { alert('No data to export.'); return; }
    const dataToExport = monthlySummaryData.summary.map(item => ({
      'Roll Number': item.roll_number,
      'Name': item.name,
      'Type': item.type,
      'Present': item.days_present,
      'Absent': item.days_absent,
      'Total Days': item.total_days
    }));
    exportToExcel(dataToExport, `Monthly_Summary_${monthlySummaryData.year}-${monthlySummaryData.month}`, 'Monthly Summary');
  };

  const handleExportMonthlyGrid = () => {
    if (!monthlyGridData || !monthlyGridData.students || monthlyGridData.students.length === 0) { alert('No data to export.'); return; }
    const days = Array.from({ length: monthlyGridData.days_in_month }, (_, i) => String(i + 1).padStart(2, '0'));
    const headers = ['Roll Number', 'Name', ...days, 'Total Present'];
    const dataRows = monthlyGridData.students.map(student => {
      const row = {
        'Roll Number': student.roll_number,
        'Name': student.name,
        'Type': student.type,
        'Total Present': student.total_present
      };
      student.attendance.forEach((dayStatus, index) => { row[days[index]] = dayStatus.present ? 'Yes' : 'No'; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(dataRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Monthly_${monthlyGridData.year}-${monthlyGridData.month}`);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Monthly_Grid_${monthlyGridData.year}-${monthlyGridData.month}.xlsx`);
  };

  // --- Render Functions ---
  const renderReportForm = () => {
    switch (reportType) {
      case 'daily':
        return (
          <form onSubmit={(e) => { e.preventDefault(); fetchDailyReport(); }}>
            <div className="mb-3">
              <label htmlFor="date" className="form-label">Select Date</label>
              <input type="date" className="form-control" id="date" name="date" value={dailyForm.date} onChange={handleDailyChange} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Generate Daily Report'}</button>
          </form>
        );
      case 'student':
        return (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleStudentSearch(); }}>
              <div className="mb-3">
                <label htmlFor="searchTerm" className="form-label">Search by Roll Number or Name</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    id="searchTerm"
                    name="searchTerm"
                    value={studentForm.searchTerm}
                    onChange={handleStudentChange}
                    placeholder="Enter roll number or name"
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-3">
                <h5>Search Results:</h5>
                <div className="list-group">
                  {searchResults.map(student => (
                    <button
                      key={student.id}
                      className="list-group-item list-group-item-action"
                      onClick={() => fetchStudentReport(student.id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{student.roll_number}</strong> - {student.name}
                        </div>
                        <span className="badge bg-secondary">{student.type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'weekly':
        return (
          <form onSubmit={(e) => { e.preventDefault(); fetchWeeklyReport(); }}>
            <div className="row g-3">
              <div className="col-md-6"><label htmlFor="startDate" className="form-label">Start Date</label><input type="date" className="form-control" id="startDate" name="startDate" value={weeklyForm.startDate} onChange={handleWeeklyChange} required /></div>
              <div className="col-md-6"><label htmlFor="endDate" className="form-label">End Date</label><input type="date" className="form-control" id="endDate" name="endDate" value={weeklyForm.endDate} onChange={handleWeeklyChange} required /></div>
            </div>
            <button type="submit" className="btn btn-primary mt-3" disabled={loading}>{loading ? 'Loading...' : 'Generate Weekly Report'}</button>
          </form>
        );
      case 'monthlySummary':
      case 'monthlyGrid': // Use the same form for both monthly types
        return (
          <form onSubmit={(e) => { 
              e.preventDefault(); 
              if (reportType === 'monthlySummary') fetchMonthlySummaryReport(); 
              else fetchMonthlyGridReport(); 
            }}>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="year" className="form-label">Year</label>
                <select className="form-select" id="year" name="year" value={monthlyForm.year} onChange={handleMonthlyChange} required>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="month" className="form-label">Month</label>
                <select className="form-select" id="month" name="month" value={monthlyForm.month} onChange={handleMonthlyChange} required>
                  <option value="01">January</option><option value="02">February</option><option value="03">March</option>
                  <option value="04">April</option><option value="05">May</option><option value="06">June</option>
                  <option value="07">July</option><option value="08">August</option><option value="09">September</option>
                  <option value="10">October</option><option value="11">November</option><option value="12">December</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
              {loading ? 'Loading...' : 
                reportType === 'monthlySummary' ? 'Generate Monthly Summary' : 'Generate Monthly Grid'
              }
            </button>
          </form>
        );
      default: return null;
    }
  };

  const renderReportData = () => {
    if (loading) return <div className="text-center mt-4"><p>Loading report...</p></div>;
    
    if (dailyData) {
      return (
        <div className="mt-4">
          <h4>Daily Report ({dailyData.date})</h4>
          <button onClick={handleExportDaily} className="btn btn-success btn-sm mb-2">Export to Excel</button>
          
          {/* Summary Section */}
          {dailyData.attendance.length > 0 && (
            <div className="alert alert-info mb-3">
              <strong>Summary:</strong> {dailyData.attendance[0].present_students_count} students present out of {dailyData.attendance[0].total_students_count} total students
              ({((dailyData.attendance[0].present_students_count / dailyData.attendance[0].total_students_count) * 100).toFixed(1)}% attendance)
            </div>
          )}
          
          {dailyData.attendance.length > 0 ? (
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.attendance.map(item => (
                  <tr key={item.student_id} className={item.is_present ? 'table-success' : 'table-danger'}>
                    <td>{item.roll_number}</td>
                    <td>{item.name}</td>
                    <td>{item.type || '-'}</td>
                    <td>{item.gender || '-'}</td>
                    <td>{item.age || '-'}</td>
                    <td>{item.is_present ? '✅ Present' : '❌ Absent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No students found.</p>}
        </div>
      );
    }
    
    if (studentData) {
        return (
            <div className="mt-4">
                <h4>Attendance Report for {studentData.student.name} ({studentData.student.roll_number})</h4>
                <button onClick={handleExportStudent} className="btn btn-success btn-sm mb-2">Export Dates to Excel</button>
                {studentData.attendance.length > 0 ? (
                    <ul className="list-group">{studentData.attendance.map(item => (<li key={item.id} className="list-group-item">{item.date}</li>))}</ul>
                ) : <p>No attendance records found for this student.</p>}
            </div>
        );
    }

    if (weeklyData) {
      return (
        <div className="mt-4">
          <h4>Weekly Report ({weeklyData.start_date} to {weeklyData.end_date})</h4>
          <button onClick={handleExportWeekly} className="btn btn-success btn-sm mb-2">Export to Excel</button>
          {weeklyData.report.length > 0 ? (
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Present</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.report.map(item => (
                  <tr key={item.student_id}>
                    <td>{item.roll_number}</td>
                    <td>{item.name}</td>
                    <td>{item.type || '-'}</td>
                    <td>{item.days_present}</td>
                    <td>{item.total_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No attendance data found for this period.</p>}
        </div>
      );
    }
    
    if (monthlySummaryData) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[monthlySummaryData.month - 1];
      return (
        <div className="mt-4">
          <h4>Monthly Summary ({monthName} {monthlySummaryData.year})</h4>
          <button onClick={handleExportMonthlySummary} className="btn btn-success btn-sm mb-2">Export to Excel</button>
          {monthlySummaryData.summary.length > 0 ? (
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Total Days</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaryData.summary.map(item => (
                  <tr key={item.student_id}>
                    <td>{item.roll_number}</td>
                    <td>{item.name}</td>
                    <td>{item.type || '-'}</td>
                    <td>{item.days_present}</td>
                    <td>{item.days_absent}</td>
                    <td>{item.total_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No attendance data found for this month.</p>}
        </div>
      );
    }
    
    if (monthlyGridData) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[monthlyGridData.month - 1];
      return (
        <div className="mt-4">
          <h4>Monthly Grid ({monthName} {monthlyGridData.year})</h4>
          <button onClick={handleExportMonthlyGrid} className="btn btn-success btn-sm mb-2">Export to Excel</button>
          {monthlyGridData.students.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-sm" style={{fontSize: '0.8rem'}}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '80px' }}>Roll</th>
                    <th style={{ minWidth: '120px' }}>Name</th>
                    <th style={{ minWidth: '120px' }}>Type</th>
                    {Array.from({ length: monthlyGridData.days_in_month }, (_, i) => (<th key={i + 1} style={{ minWidth: '30px', textAlign: 'center' }}>{i + 1}</th>))}
                    <th style={{ minWidth: '50px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyGridData.students.map(student => (
                    <tr key={student.student_id}>
                      <td>{student.roll_number}</td>
                      <td>{student.name}</td>
                      <td>{student.type || '-'}</td>
                      {student.attendance.map((dayStatus, index) => (<td key={index} style={{ textAlign: 'center', backgroundColor: dayStatus.present ? '#dff0d8' : '#f2dede' }}>{dayStatus.present ? '✔️' : '❌'}</td>))}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{student.total_present}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p>No attendance data found for this month.</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="mb-4">Attendance Reports</h2>
      
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item"><button className={`nav-link ${reportType === 'daily' ? 'active' : ''}`} onClick={() => setReportType('daily')}>Daily</button></li>
            <li className="nav-item"><button className={`nav-link ${reportType === 'student' ? 'active' : ''}`} onClick={() => setReportType('student')}>By Student</button></li>
            <li className="nav-item"><button className={`nav-link ${reportType === 'weekly' ? 'active' : ''}`} onClick={() => setReportType('weekly')}>Weekly</button></li>
            <li className="nav-item"><button className={`nav-link ${reportType === 'monthlySummary' ? 'active' : ''}`} onClick={() => setReportType('monthlySummary')}>Monthly Summary</button></li>
            <li className="nav-item"><button className={`nav-link ${reportType === 'monthlyGrid' ? 'active' : ''}`} onClick={() => setReportType('monthlyGrid')}>Monthly Grid</button></li>
          </ul>
        </div>
        <div className="card-body">
          {renderReportForm()}
        </div>
      </div>
      
      {renderReportData()}
    </div>
  );
};

export default ReportsPanel; 