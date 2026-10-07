import React, { useRef, useState, useEffect } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Play, Pause } from 'lucide-react';

export default function AudioRecorder({ recordedBlob, onRecordingComplete, onReset }) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'recorded'
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone recording is not supported in this browser. Please upload an audio file.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mimeType
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `recorded_bird_${Date.now()}.${ext}`, { type: mime });

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('recorded');
        onRecordingComplete(file);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // Slice chunks every 250ms
      setRecordingState('recording');
      setTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else {
        setError(`Unable to start microphone recording: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleReset = () => {
    setRecordingState('idle');
    setTimer(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    onReset();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      {error && (
        <div className="alert alert-error" style={{ textAlign: 'left' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {recordingState === 'idle' && (
        <div>
          <button
            type="button"
            onClick={startRecording}
            className="btn btn-primary btn-lg"
            style={{ borderRadius: '50px', padding: '1rem 2.5rem' }}
          >
            <Mic size={22} />
            <span>Start Recording</span>
          </button>
          <p style={{ marginTop: '1rem', color: 'var(--slate-500)', fontSize: '0.88rem' }}>
            Click to record bird vocalizations directly from your device microphone.
          </p>
        </div>
      )}

      {recordingState === 'recording' && (
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#ef4444',
            marginBottom: '1rem',
            animation: 'pulse 1.5s infinite',
          }}>
            <Mic size={36} />
          </div>
          <style>{`
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { transform: scale(1.05); box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
          `}</style>

          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#ef4444', marginBottom: '1.25rem' }}>
            {formatTimer(timer)}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="btn btn-danger btn-lg"
            style={{ borderRadius: '50px', padding: '0.9rem 2.2rem' }}
          >
            <Square size={20} />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      {recordingState === 'recorded' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-800)', marginBottom: '0.5rem' }}>
            Recording Complete ({formatTimer(timer)})
          </h3>

          {audioUrl && (
            <div style={{ margin: '1.25rem 0' }}>
              <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '400px' }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
            >
              <RotateCcw size={16} />
              <span>Re-record</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
