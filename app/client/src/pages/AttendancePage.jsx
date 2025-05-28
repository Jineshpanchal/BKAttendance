import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceAPI } from '../services/api';

// --- UI Sub-components ---

// Loading state UI
const LoadingUI = ({ centerName }) => (
  <div className="keypad-container responsive-container">
    <div className="center-header">
      <h2 className="center-name">{centerName}</h2>
      <p className="attendance-subheader">Meditation Center Daily Attendance</p>
    </div>
    <div className="text-center">
      <p>Loading attendance system...</p>
    </div>
  </div>
);

// Toast message component
const Toast = ({ message, messageType }) => {
  if (!message) return null;
  
  return (
    <div className="toast-container">
      <div className={`toast-message ${messageType === 'success' ? 'toast-success' : 'toast-error'}`}>
        {message}
      </div>
    </div>
  );
};

// Logout icon component
const LogoutIcon = ({ onLogout }) => (
  <div className="logout-icon" title="Logout" onClick={onLogout}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  </div>
);

// Password entry UI
const PasswordEntryUI = ({ 
  centerName, 
  attendancePassword, 
  handlePasswordChange, 
  handleVerifyPassword, 
  loading, 
  message, 
  messageType
}) => (
  <div className="keypad-container responsive-container">
    <div className="center-header">
      <h2 className="center-name">{centerName}</h2>
      <p className="attendance-subheader">Meditation Center Daily Attendance</p>
    </div>
    
    <div className="password-container">
      <h3 className="password-title">Password Required</h3>
      
      <div className="password-input-container">
        <input
          type="password"
          className="password-input"
          value={attendancePassword}
          onChange={handlePasswordChange}
          placeholder="Enter attendance password"
          required
          autoFocus // Added autoFocus for better UX
        />
      </div>
      
      <button 
        className="password-button"
        onClick={handleVerifyPassword}
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Submit Password'}
      </button>
    </div>
    
    <Toast message={message} messageType={messageType} />
  </div>
);

// Main keypad UI
const KeypadUI = ({
  centerName,
  rollNumber,
  handleKeyPress,
  handleClear,
  handleSubmit,
  loading,
  message,
  messageType,
  onLogout,
  showLogout = false // Add prop to control logout visibility
}) => (
  <div className="keypad-container responsive-container">
    <div className="center-header">
      <div className="center-info">
        <h2 className="center-name">{centerName}</h2>
        <p className="attendance-subheader">Meditation Center Daily Attendance</p>
      </div>
      {showLogout && <LogoutIcon onLogout={onLogout} />}
    </div>
    
    <div className="keypad-display">
      {rollNumber || '___'}
    </div>
    
    <div className="keypad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
        <button
          key={digit}
          className="keypad-button"
          onClick={() => handleKeyPress(digit)}
          disabled={loading || rollNumber.length >= 3}
        >
          {digit}
        </button>
      ))}
      <button
        className="keypad-button clear-button"
        onClick={handleClear} // Corrected: Pass the function directly
        disabled={loading}
      >
        Clear
      </button>
      <button
        className="keypad-button"
        onClick={() => handleKeyPress(0)}
        disabled={loading || rollNumber.length >= 3}
      >
        0
      </button>
      <button
        className="keypad-button submit-button"
        onClick={handleSubmit} // Corrected: Pass the function directly
        disabled={loading || !rollNumber}
      >
        OK
      </button>
    </div>
    
    <Toast message={message} messageType={messageType} />
  </div>
);

// --- Main Attendance Page Component ---

const AttendancePage = () => {
  const { centerId } = useParams();
  const navigate = useNavigate();
  const [rollNumber, setRollNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [attendancePassword, setAttendancePassword] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Changed initial state to true
  const [centerName, setCenterName] = useState('Meditation Center');

  // Check if attendance is password protected and check for stored password
  useEffect(() => {
    const checkPasswordProtection = async () => {
      setIsLoading(true); // Set loading true at the start
      try {
        // Check if a verified password exists in session storage for this center
        const storedPassword = sessionStorage.getItem(`attendance_password_${centerId}`);
        const isVerified = sessionStorage.getItem(`password_verified_${centerId}`) === 'true';
        
        if (storedPassword) {
          setAttendancePassword(storedPassword);
        }
        
        const response = await attendanceAPI.checkPasswordProtection(centerId);
        setIsPasswordProtected(response.data.password_protected);
        
        // If available, fetch center name for display
        if (response.data.center_name) {
          setCenterName(response.data.center_name);
        }
        
        // If not password protected or already verified from session storage, skip verification
        if (!response.data.password_protected || isVerified) {
          setIsPasswordVerified(true);
        }
      } catch (err) {
        console.error('Error checking password protection:', err);
        // Check if center exists based on error (e.g., 404)
        if (err.response?.status === 404) {
            setMessage('Invalid attendance link. Center not found.');
        } else {
        setMessage('Error connecting to the attendance system. Please try again.');
        }
        setMessageType('error');
        // Consider navigating away or showing a persistent error if the center is invalid
      } finally {
        setIsLoading(false); // Set loading false at the end
      }
    };
    
    checkPasswordProtection();
  }, [centerId]);

  // Reset message after 5 seconds
  useEffect(() => {
    let timer;
    if (message) {
      timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [message]);

  const handleKeyPress = (digit) => {
    if (rollNumber.length < 3) {
      setRollNumber(prev => prev + digit);
    }
  };

  const handleClear = () => {
    setRollNumber('');
    setMessage('');
    setMessageType('');
  };

  const handlePasswordChange = (e) => {
    setAttendancePassword(e.target.value);
  };

  const handleVerifyPassword = async () => {
    if (!attendancePassword) {
      setMessage('Please enter the password');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      // Use the dedicated password verification method
      // Need to ensure the API actually validates the password here
      // Let's assume markByRoll with '000' does this for now
      // If verifyPassword API exists and works differently, use that.
       await attendanceAPI.markByRoll(
        centerId, 
        '000', // Use '000' to signify password check
        attendancePassword
      );
      
      // If the above call succeeds, the password is correct
      sessionStorage.setItem(`attendance_password_${centerId}`, attendancePassword);
      sessionStorage.setItem(`password_verified_${centerId}`, 'true');
      setIsPasswordVerified(true);
      setMessage('Password accepted. You can now mark attendance.');
      setMessageType('success');
      
    } catch (err) {
      console.error('Error during password verification:', err);
       // Check for specific password error (e.g., 401)
      if (err.response?.status === 401) {
        setMessage('Invalid attendance password.');
      } else {
      setMessage('Error verifying password. Please try again.');
      }
      setMessageType('error');
      // Clear stored verification on failure
      sessionStorage.removeItem(`password_verified_${centerId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rollNumber) {
      setMessage('Please enter a roll number');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // Normalize roll number - pad with leading zeros to 3 digits
      // This ensures that "2", "02", and "002" are all treated as the same number
      const normalizedRollNumber = rollNumber.padStart(3, '0');
      
      const response = await attendanceAPI.markByRoll(
        centerId,
        normalizedRollNumber,
        isPasswordProtected ? attendancePassword : null
      );
      
      // Show success message with student name
      setMessage(response.data.message);
      setMessageType('success');
      
      // Clear the roll number field to prepare for next entry
      setRollNumber('');
    } catch (err) {
      console.error('Error marking attendance:', err);
      
      if (err.response?.status === 401) {
        // Password issues
        setMessage(err.response.data.message || 'Password verification failed');
        setMessageType('error');
        
        // If credentials have been invalidated, reset password verification
        if (err.response.data.password_protected) {
          setIsPasswordVerified(false);
          // We should also clear session storage
          sessionStorage.removeItem(`password_verified_${centerId}`);
        }
      } else if (err.response?.status === 404) {
        // Student not found
        setMessage(err.response.data.message || 'Student not found with this roll number');
        setMessageType('error');
      } else {
        // Other errors
        setMessage(err.response?.data?.message || 'An error occurred. Please try again.');
        setMessageType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle logout (clear session verification)
  const handleLogout = () => {
    sessionStorage.removeItem(`attendance_password_${centerId}`);
    sessionStorage.removeItem(`password_verified_${centerId}`);
    setIsPasswordVerified(false); // Update state to trigger re-render to password screen
    setAttendancePassword(''); // Clear password state
    setMessage('Logged out. Please enter password again.');
    setMessageType('success'); // Use success for logout message
  };
  
  // Main render logic using external components
  return (
    <div className="attendance-page-wrapper">
      {isLoading ? (
        <LoadingUI centerName={centerName} />
      ) : isPasswordProtected && !isPasswordVerified ? (
        <PasswordEntryUI 
          centerName={centerName}
          attendancePassword={attendancePassword}
          handlePasswordChange={handlePasswordChange}
          handleVerifyPassword={handleVerifyPassword}
          loading={loading}
          message={message}
          messageType={messageType}
        />
      ) : (
        <KeypadUI 
          centerName={centerName}
          rollNumber={rollNumber}
          handleKeyPress={handleKeyPress}
          handleClear={handleClear}
          handleSubmit={handleSubmit}
          loading={loading}
          message={message}
          messageType={messageType}
          onLogout={handleLogout}
          showLogout={isPasswordProtected}
        />
      )}
    </div>
  );
};

export default AttendancePage; 