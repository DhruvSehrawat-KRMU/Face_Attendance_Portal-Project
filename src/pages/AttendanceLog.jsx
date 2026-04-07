import { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import './AttendanceLog.css';

export default function AttendanceLog() {
  const { attendanceRecords, clearAttendance, registeredFaces } = useAttendance();
  const [filterDate, setFilterDate] = useState('');
  const [filterName, setFilterName] = useState('');

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchDate = !filterDate || record.date === filterDate;
    const matchName =
      !filterName || record.personName.toLowerCase().includes(filterName.toLowerCase());
    return matchDate && matchName;
  });

  const uniqueDates = [...new Set(attendanceRecords.map((r) => r.date))].sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['Name', 'Date', 'Time', 'Status'];
    const rows = filteredRecords.map((r) => [r.personName, r.date, r.time, r.status]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toDateString();
  const todayCount = attendanceRecords.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  ).length;

  return (
    <div className="attendance-log">
      <div className="page-header">
        <div>
          <h1>Attendance Records</h1>
          <p className="page-subtitle">View and manage attendance history</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={exportCSV} disabled={filteredRecords.length === 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-value">{todayCount}</span>
          <span className="summary-label">Present Today</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{registeredFaces.length}</span>
          <span className="summary-label">Total Registered</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{attendanceRecords.length}</span>
          <span className="summary-label">Total Records</span>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Search by Name</label>
          <input
            type="text"
            placeholder="Search..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Filter by Date</label>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="filter-select"
          >
            <option value="">All Dates</option>
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>
        {(filterDate || filterName) && (
          <button
            className="clear-filters"
            onClick={() => {
              setFilterDate('');
              setFilterName('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="records-table-wrapper">
        {filteredRecords.length === 0 ? (
          <div className="empty-records">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>No attendance records found</p>
            {attendanceRecords.length > 0 && (
              <button
                className="clear-filters"
                onClick={() => {
                  setFilterDate('');
                  setFilterName('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="record-person">
                      <div className="record-avatar">
                        {record.personName.charAt(0).toUpperCase()}
                      </div>
                      <span>{record.personName}</span>
                    </div>
                  </td>
                  <td>{record.date}</td>
                  <td>{record.time}</td>
                  <td>
                    <span className={`status-badge ${record.status}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {attendanceRecords.length > 0 && (
        <div className="danger-zone">
          <button className="btn btn-danger-outline" onClick={clearAttendance}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear All Records
          </button>
        </div>
      )}
    </div>
  );
}
