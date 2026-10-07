import React from 'react';
import { Cpu, Music, Shield, Database, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>About the System</h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '1.1rem' }}>
          AI-Based Bird Sound Identification and Species Information System
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-800)' }}>
          <Award size={22} /> Project Purpose &amp; Academic Scope
        </h2>
        <p style={{ color: 'var(--slate-700)', lineHeight: 1.7, marginBottom: '1rem' }}>
          This full-stack academic project demonstrates modern bioacoustics, machine learning, and secure cloud software engineering.
          It enables researchers, students, and birdwatchers to record or upload avian vocalizations, identify bird species using local deep learning inference,
          and securely manage ecological observation histories.
        </p>
        <p style={{ color: 'var(--slate-700)', lineHeight: 1.7 }}>
          Built for Master of Computer Applications (MCA) viva demonstration, this system emphasizes clear architectural separation, modular design,
          verifiable bioacoustic inference, and zero reliance on third-party commercial AI APIs (like OpenAI or Google Gemini).
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-800)' }}>
          <Cpu size={22} /> AI &amp; Bioacoustic Engine (BirdNET)
        </h2>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--slate-700)', lineHeight: 1.8 }}>
          <li>
            <strong>Cornell Lab of Ornithology Model:</strong> Uses BirdNET's deep residual convolutional neural network (CNN) trained on over 6,000 avian species worldwide.
          </li>
          <li>
            <strong>Local Offline Inference:</strong> The model is loaded once at startup into memory and executed locally via TensorFlow Lite with CPU acceleration (XNNPACK).
          </li>
          <li>
            <strong>Sliding Window Analysis:</strong> Audio is segmented into 3-second acoustic windows, resampled to 48 kHz, and scored for multi-species confidence probabilities.
          </li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-800)' }}>
          <Music size={22} /> Bioacoustic Spectrogram Generation
        </h2>
        <p style={{ color: 'var(--slate-700)', lineHeight: 1.7 }}>
          Using <strong>Librosa</strong> and scientific signal processing, the backend computes Mel-scale power spectrograms (<span style={{ fontStyle: 'italic' }}>dB magnitude vs frequency &amp; time</span>) from uploaded recordings. This visualizes harmonic patterns, call pulses, and pitch modulations characteristic of specific avian species.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-800)' }}>
          <Shield size={22} /> Security &amp; Database Architecture
        </h2>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--slate-700)', lineHeight: 1.8 }}>
          <li>
            <strong>PostgreSQL &amp; Row Level Security:</strong> User recordings are isolated using PostgreSQL RLS policies where <code>auth.uid() = user_id</code>.
          </li>
          <li>
            <strong>Private Object Storage:</strong> Uploaded audio files are stored in a private Supabase bucket (<code>bird-audio</code>) and accessed only via short-lived signed URLs.
          </li>
          <li>
            <strong>JWT Verification:</strong> The FastAPI backend cryptographically verifies Supabase access tokens on all protected routes.
          </li>
        </ul>
      </div>
    </div>
  );
}
