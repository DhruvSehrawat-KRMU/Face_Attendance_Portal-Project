import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import FaceRecognition from './pages/FaceRecognition';
import RegisterFace from './pages/RegisterFace';
import AttendanceLog from './pages/AttendanceLog';
import UploadAttendance from './pages/UploadAttendance';
import './App.css';

function App() {
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <AttendanceProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/recognize" element={<FaceRecognition />} />
                <Route path="/upload" element={<UploadAttendance />} />
                <Route path="/register" element={<RegisterFace />} />
                <Route path="/records" element={<AttendanceLog />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AttendanceProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
