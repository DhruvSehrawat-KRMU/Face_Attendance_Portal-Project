import { useRef, useState, useEffect, useCallback } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { loadModels, createFaceMatcher, faceapi } from '../utils/faceApi';
import './FaceRecognition.css';

export default function FaceRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const registeredFacesRef = useRef([]);
  const lastRecognizedRef = useRef(null);

  const { registeredFaces, markAttendance, getTodayAttendance } = useAttendance();

  const [isStreaming, setIsStreaming] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading face recognition models...');
  const [notification, setNotification] = useState(null);
  const [matchPulse, setMatchPulse] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    registeredFacesRef.current = registeredFaces;
  }, [registeredFaces]);

  useEffect(() => {
    loadModels()
      .then((success) => {
        if (success) {
          setModelsReady(true);
          setStatus('Models loaded. Start the camera to begin.');
        } else {
          setStatus('Failed to load models. Check console for errors.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Model loading error:', err);
        setStatus('Failed to load models. Check console for errors.');
        setLoading(false);
      });
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
      setStatus('Camera active. Looking for faces...');
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setStatus('Camera stopped.');
    lastRecognizedRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Wait for video to have valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(handleVideoPlay, 100);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('Registered faces count:', registeredFacesRef.current.length);

    let isRunning = false;

    const recognize = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      if (isRunning) {
        animationRef.current = requestAnimationFrame(recognize);
        return;
      }

      isRunning = true;

      try {
        const currentFaces = registeredFacesRef.current;

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          console.log('Detected', detections.length, 'face(s)');

          const faceMatcher = createFaceMatcher(currentFaces);

          for (const detection of detections) {
            const box = detection.detection.box;

            // Mirror x-coordinate to match CSS scaleX(-1) on the video
            const mirroredX = canvas.width - box.x - box.width;

            // Draw bounding box
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 3;
            ctx.strokeRect(mirroredX, box.y, box.width, box.height);

            let label = 'Unknown';
            let bgColor = '#dc2626';

            if (faceMatcher) {
              const match = faceMatcher.findBestMatch(detection.descriptor);
              label = match.label;
              console.log('Match result:', match.label, 'distance:', match.distance);

              if (match.label !== 'unknown') {
                bgColor = '#059669';

                // Mark attendance if not already done
                const face = currentFaces.find((f) => f.name === match.label);
                if (face && match.distance < 0.5 && lastRecognizedRef.current !== face.id) {
                  lastRecognizedRef.current = face.id;
                  setMatchPulse(true);
                  setTimeout(() => setMatchPulse(false), 700);
                  const result = markAttendance(face.id, face.name);
                  if (result) {
                    showNotification(`Attendance marked for ${face.name}!`, 'success');
                    setStatus(`${face.name} checked in successfully!`);
                  } else {
                    showNotification(`${face.name} already marked today.`, 'info');
                    setStatus(`${face.name} already checked in today.`);
                  }
                }
              }
            }

            // Draw label background
            const labelText = label === 'unknown' ? 'Unknown' : label;
            ctx.font = 'bold 14px system-ui, sans-serif';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillStyle = bgColor;
            ctx.fillRect(mirroredX - 1, box.y - 30, textWidth + 16, 30);

            // Draw label text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, mirroredX + 6, box.y - 10);
          }

          if (detections.length > 0 && !registeredFacesRef.current.length) {
            setStatus('Face detected! Register people first to identify them.');
          }
        } else {
          setStatus('No face detected. Position your face in the frame.');
        }
      } catch (err) {
        console.error('Detection error:', err);
        setStatus('Detection error: ' + (err.message || 'Unknown error'));
      }

      isRunning = false;
      animationRef.current = requestAnimationFrame(recognize);
    };

    recognize();
  };

  const todayRecords = getTodayAttendance();
  const totalRegistered = registeredFaces.length;
  const presentToday = todayRecords.length;
  const absentToday = Math.max(0, totalRegistered - presentToday);

  return (
    <div className="face-recognition">
      <div className="page-header">
        <h1>Mark Attendance</h1>
        <p className="page-subtitle">Use your camera to check in with face recognition</p>
      </div>

      <div className="recognition-stats">
        <div className="stat-card stat-total">
          <span className="stat-value">{totalRegistered}</span>
          <span className="stat-label">Registered</span>
        </div>
        <div className="stat-card stat-present">
          <span className="stat-value">{presentToday}</span>
          <span className="stat-label">Present Today</span>
        </div>
        <div className="stat-card stat-absent">
          <span className="stat-value">{absentToday}</span>
          <span className="stat-label">Absent Today</span>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {notification.type === 'success' ? (
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            ) : (
              <circle cx="12" cy="12" r="10" />
            )}
            {notification.type === 'success' ? (
              <polyline points="22 4 12 14.01 9 11.01" />
            ) : (
              <line x1="12" y1="8" x2="12" y2="12" />
            )}
          </svg>
          {notification.message}
        </div>
      )}

      <div className="recognition-container">
        <div className={`camera-section${matchPulse ? ' matched' : ''}`}>
          <div className="camera-wrapper">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onPlay={handleVideoPlay}
              className={isStreaming ? 'visible' : 'hidden'}
            />
            <canvas ref={canvasRef} className="overlay-canvas" />
            {!isStreaming && (
              <div className="camera-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M6 17l2 3h8l2-3" />
                </svg>
                <p>Camera is off</p>
              </div>
            )}
          </div>

          <div className="status-bar">
            <div className={`status-dot ${isStreaming ? 'active' : ''}`} />
            <span>{status}</span>
          </div>

          <div className="camera-controls">
            {!isStreaming ? (
              <button
                className="btn btn-primary"
                onClick={startCamera}
                disabled={!modelsReady || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {loading ? 'Loading Models...' : 'Start Camera'}
              </button>
            ) : (
              <button className="btn btn-danger" onClick={stopCamera}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Stop Camera
              </button>
            )}
          </div>
        </div>

        <div className="today-sidebar">
          <h3>Today's Check-ins</h3>
          {todayRecords.length === 0 ? (
            <div className="sidebar-empty">
              <p>No check-ins yet today</p>
            </div>
          ) : (
            <div className="checkin-list">
              {todayRecords.map((record) => (
                <div key={record.id} className="checkin-item">
                  <div className="checkin-avatar">
                    {record.personName.charAt(0).toUpperCase()}
                  </div>
                  <div className="checkin-info">
                    <span className="checkin-name">{record.personName}</span>
                    <span className="checkin-time">{record.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
