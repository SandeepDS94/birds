import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import AudioUploader from '../components/AudioUploader';
import AudioRecorder from '../components/AudioRecorder';
import AnalysisProgress from '../components/AnalysisProgress';
import IdentificationResult from '../components/IdentificationResult';
import { UploadCloud, Mic, AlertCircle, Sparkles } from 'lucide-react';

export default function Identify() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'record' ? 'record' : 'upload';

  const [mode, setMode] = useState(initialMode);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'record' || urlMode === 'upload') {
      setMode(urlMode);
    }
  }, [searchParams]);

  const handleStartIdentification = async () => {
    if (!selectedFile) {
      setError('Please select or record an audio file first.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await api.identifyAudio(selectedFile);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        throw new Error(response.message || 'Identification failed.');
      }
    } catch (err) {
      console.error('Identification error:', err);
      setError(err.message || 'An error occurred during identification.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError('');
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      {!result && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            AI Bird Sound Identification
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Upload a bird audio recording or record live using your microphone. Cornell BirdNET will analyze the sound in real time.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <AnalysisProgress />
        </div>
      )}

      {/* Result View */}
      {!loading && result && (
        <IdentificationResult result={result} onReset={handleReset} />
      )}

      {/* Input Form View */}
      {!loading && !result && (
        <div className="card" style={{ padding: '2.5rem' }}>
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--slate-100)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '2rem',
          }}>
            <button
              type="button"
              onClick={() => { setMode('upload'); setSelectedFile(null); setError(''); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: mode === 'upload' ? 'white' : 'transparent',
                color: mode === 'upload' ? 'var(--primary-700)' : 'var(--slate-600)',
                boxShadow: mode === 'upload' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <UploadCloud size={18} />
              <span>Upload Audio File</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('record'); setSelectedFile(null); setError(''); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: mode === 'record' ? 'white' : 'transparent',
                color: mode === 'record' ? 'var(--primary-700)' : 'var(--slate-600)',
                boxShadow: mode === 'record' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Mic size={18} />
              <span>Microphone Recording</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Tab Content */}
          {mode === 'upload' ? (
            <AudioUploader
              selectedFile={selectedFile}
              onFileSelected={(file) => {
                setSelectedFile(file);
                setError('');
              }}
            />
          ) : (
            <AudioRecorder
              recordedBlob={selectedFile}
              onRecordingComplete={(file) => {
                setSelectedFile(file);
                setError('');
              }}
              onReset={() => setSelectedFile(null)}
            />
          )}

          {/* Action Button */}
          {selectedFile && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                type="button"
                id="identify-btn"
                data-testid="identify-btn"
                onClick={handleStartIdentification}
                className="btn btn-primary btn-lg"
                style={{ minWidth: '220px' }}
              >
                <Sparkles size={18} />
                <span>Identify Bird Species</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
