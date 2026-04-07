import { createContext, useContext, useState, useEffect } from 'react';

const AttendanceContext = createContext();

function getDayKey(timestamp) {
  return new Date(timestamp).toDateString();
}

function dedupeAttendanceRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const dayKey = getDayKey(record.timestamp);
    const dedupeKey = `${record.personId}-${dayKey}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

export function AttendanceProvider({ children }) {
  const [registeredFaces, setRegisteredFaces] = useState(() => {
    const saved = localStorage.getItem('registeredFaces');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const saved = localStorage.getItem('attendanceRecords');
    if (!saved) return [];
    return dedupeAttendanceRecords(JSON.parse(saved));
  });

  useEffect(() => {
    localStorage.setItem('registeredFaces', JSON.stringify(registeredFaces));
  }, [registeredFaces]);

  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  const registerFace = (name, rollNumber, descriptor) => {
    const newFace = {
      id: Date.now().toString(),
      name,
      rollNumber,
      descriptor: Array.from(descriptor),
      registeredAt: new Date().toISOString(),
    };
    setRegisteredFaces((prev) => [...prev, newFace]);
    return newFace;
  };

  const removeFace = (id) => {
    setRegisteredFaces((prev) => prev.filter((f) => f.id !== id));
  };

  const markAttendance = (personId, personName) => {
    const now = new Date();
    const today = now.toDateString();
    let createdRecord = null;

    setAttendanceRecords((prev) => {
      const alreadyMarked = prev.some(
        (r) => r.personId === personId && getDayKey(r.timestamp) === today
      );
      if (alreadyMarked) return prev;

      createdRecord = {
        id: Date.now().toString(),
        personId,
        personName,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        status: 'present',
      };

      return [createdRecord, ...prev];
    });

    return createdRecord;
  };

  const clearAttendance = () => {
    setAttendanceRecords([]);
  };

  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    return attendanceRecords.filter(
      (r) => new Date(r.timestamp).toDateString() === today
    );
  };

  return (
    <AttendanceContext.Provider
      value={{
        registeredFaces,
        attendanceRecords,
        registerFace,
        removeFace,
        markAttendance,
        clearAttendance,
        getTodayAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
}
