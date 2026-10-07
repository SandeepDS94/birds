import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, UploadCloud, Cpu, Activity, Database, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3.5rem 1rem 4rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--primary-50)',
          color: 'var(--primary-800)',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          fontWeight: 600,
          fontSize: '0.88rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--primary-100)',
        }}>
          <Cpu size={16} /> Powered by Cornell Lab BirdNET &amp; Deep Learning
        </div>

        <h1 style={{
          fontSize: '3.25rem',
          fontWeight: 800,
          color: 'var(--slate-950)',
          letterSpacing: '-0.025em',
          maxWidth: '850px',
          margin: '0 auto 1.25rem',
          lineHeight: 1.15,
        }}>
          Identify Birds by Their Sounds
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--slate-600)',
          maxWidth: '650px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6,
        }}>
          Upload or record a bird sound and let AI identify the species. Real bioacoustic neural network inference running directly on audio.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/identify?mode=upload" className="btn btn-primary btn-lg">
            <UploadCloud size={20} />
            <span>Upload Audio</span>
          </Link>
          <Link to="/identify?mode=record" className="btn btn-secondary btn-lg">
            <Mic size={20} />
            <span>Record Sound</span>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container" style={{ marginBottom: '4rem' }}>
        <div className="grid-3">
          <div className="card">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Cornell BirdNET Inference</h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.92rem' }}>
              Identifies vocalizations using Cornell Lab’s state-of-the-art bioacoustic deep learning model loaded locally with zero third-party API dependencies.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: 'var(--accent-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Activity size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Dynamic Mel-Spectrograms</h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.92rem' }}>
              Visualizes real frequency and harmonic distributions generated dynamically using Librosa and acoustic Fourier transforms.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Database size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Comprehensive Species Library</h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.92rem' }}>
              Maps identifications to verified Indian and global species, providing taxonomy, habitat, diet, and authentic high-resolution imagery.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action banner */}
      <section className="container" style={{ marginBottom: '3rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-900), var(--primary-800))',
          color: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: 'var(--elevated-shadow)',
        }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>
              Ready to explore bird calls?
            </h2>
            <p style={{ color: '#a7f3d0', maxWidth: '520px', fontSize: '1.05rem' }}>
              Browse our catalog of 30+ birds or record live calls in your garden or park right now.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/birds" className="btn btn-secondary btn-lg" style={{ background: 'white', color: 'var(--primary-900)' }}>
              <span>Browse Bird Library</span>
            </Link>
            <Link to="/identify" className="btn btn-primary btn-lg" style={{ background: 'var(--primary-500)' }}>
              <span>Start Identifying</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
