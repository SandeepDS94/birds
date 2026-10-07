import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = [
  'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/mpeg', 'audio/mp3',
  'audio/ogg', 'audio/vorbis',
  'audio/flac', 'audio/x-flac',
  'audio/mp4', 'audio/x-m4a', 'audio/webm',
];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export default function AudioUploader({ selectedFile, onFileSelected }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndSelectFile = (file) => {
    setError('');
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'webm'];

    if (!validExtensions.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a WAV, MP3, OGG, FLAC, M4A, or WebM audio file.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('File size exceeds the 25 MB limit.');
      return;
    }

    if (file.size === 0) {
      setError('Uploaded audio file is empty (0 bytes).');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary-500)' : selectedFile ? 'var(--primary-600)' : 'var(--slate-300)'}`,
          background: dragOver ? 'var(--primary-50)' : selectedFile ? 'var(--primary-50)' : 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
        }}
      >
        <input
          ref={fileInputRef}
          id="audio-file-input"
          data-testid="audio-file-input"
          type="file"
          accept=".wav,.mp3,.ogg,.flac,.m4a,.webm,audio/*"
          style={{ display: 'none' }}
          onChange={handleChange}
        />

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: selectedFile ? 'var(--primary-100)' : 'var(--slate-100)',
          color: selectedFile ? 'var(--primary-700)' : 'var(--slate-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          {selectedFile ? <FileAudio size={28} /> : <UploadCloud size={28} />}
        </div>

        {selectedFile ? (
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-800)', marginBottom: '0.25rem' }}>
              {selectedFile.name}
            </h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for AI identification
            </p>
            <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--primary-600)', fontWeight: 600 }}>
              Click or drag another file to replace
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Drag &amp; Drop audio file here
            </h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Supported formats: WAV, MP3, OGG, FLAC, M4A, WebM (Max 25 MB)
            </p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Browse Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
