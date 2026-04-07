import { useAttendance } from '../context/AttendanceContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { registeredFaces, attendanceRecords, getTodayAttendance } = useAttendance();

  const todayRecords = getTodayAttendance();
  const totalRegistered = registeredFaces.length;
  const todayPresent = todayRecords.length;
  const totalAbsent = totalRegistered - todayPresent;

  const recentActivity = attendanceRecords.slice(0, 5);

  const absentToday = registeredFaces
    .filter((person) => !todayRecords.some((record) => record.personName === person.name))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Face Recognition Attendance System</p>
      </div>

      <div className="onboarding-steps">
        <div className="step-card">
          <span className="step-number">1</span>
          <div>
            <h3>Register People</h3>
            <p>Add students and team members in Register Face.</p>
          </div>
        </div>
        <div className="step-card">
          <span className="step-number">2</span>
          <div>
            <h3>Start Recognition</h3>
            <p>Open Mark Attendance and start camera.</p>
          </div>
        </div>
        <div className="step-card">
          <span className="step-number">3</span>
          <div>
            <h3>Check People In</h3>
            <p>Look at camera to auto-mark attendance.</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{totalRegistered}</span>
            <span className="stat-label">Registered</span>
          </div>
        </div>

        <div className="stat-card stat-present">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{todayPresent}</span>
            <span className="stat-label">Present Today</span>
          </div>
        </div>

        <div className="stat-card stat-absent">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{totalAbsent}</span>
            <span className="stat-label">Absent Today</span>
          </div>
        </div>

        <div className="stat-card stat-records">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{attendanceRecords.length}</span>
            <span className="stat-label">Total Records</span>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/recognize" className="action-card action-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <circle cx="12" cy="10" r="3" />
            <path d="M6 17l2 3h8l2-3" />
          </svg>
          <span>Mark Attendance</span>
          <p>Use face recognition to check in</p>
        </Link>
        <Link to="/register" className="action-card action-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <span>Register New Face</span>
          <p>Add a new person to the system</p>
        </Link>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentActivity.length === 0 && absentToday.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p>No attendance records yet</p>
            <Link to="/recognize" className="empty-link">Mark your first attendance</Link>
          </div>
        ) : (
          <>
            <div className="activity-list">
              {recentActivity.map((record) => (
                <div key={record.id} className="activity-item">
                  <div className="activity-avatar">
                    {record.personName.charAt(0).toUpperCase()}
                  </div>
                  <div className="activity-details">
                    <span className="activity-name">{record.personName}</span>
                    <span className="activity-time">{record.date} at {record.time}</span>
                  </div>
                  <span className="activity-badge present">Present</span>
                </div>
              ))}
            </div>

            {absentToday.length > 0 && (
              <div className="absent-list-wrapper">
                <h3>Absent Today</h3>
                <div className="activity-list">
                  {absentToday.map((person) => (
                    <div key={person.name} className="activity-item absent-item">
                      <div className="activity-avatar">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="activity-details">
                        <span className="activity-name">{person.name}</span>
                        <span className="activity-time">Absent ✔</span>
                      </div>
                      <span className="activity-badge absent">Absent</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
