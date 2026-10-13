import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  MapPin,
  Utensils,
  Shield,
  RotateCcw,
  AlertTriangle,
  Layers,
  Activity,
  CheckCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';

const getBirdImageUrl = (info, sciName) => {
  if (info?.image_url && (info.image_url.startsWith('/images/') || info.image_url.startsWith('http'))) {
    return info.image_url;
  }
  const name = sciName || info?.scientific_name;
  if (name) {
    const slug = name.toLowerCase().trim().replace(/[\s-]+/g, '_');
    return `/images/birds/${slug}.jpg`;
  }
  return info?.image_url || null;
};

export default function IdentificationResult({ result, onReset }) {
  if (!result) return null;

  const {
    status,
    bird_name,
    scientific_name,
    confidence,
    recording_duration,
    audio_url,
    spectrogram,
    top_predictions = [],
    bird_info,
    message,
  } = result;

  const isLowConfidence = status === 'low_confidence' || status === 'no_detection';
  const confidencePercent = Math.round((confidence || 0) * 100);

  // Image generation states
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  // Determine current image URL
  const defaultCatalogImg = bird_info?.in_database ? getBirdImageUrl(bird_info, scientific_name) : null;
  const currentImageUrl = generatedImage || bird_info?.image_url || defaultCatalogImg;

  const handleGenerateImage = async () => {
    if (!bird_name && !scientific_name) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await api.generateBirdImage({
        commonName: bird_name || scientific_name,
        scientificName: scientific_name,
      });
      if (res?.success && res?.data?.image_url) {
        setGeneratedImage(res.data.image_url);
        setImageMeta(res.data);
      } else {
        setGenError(res?.message || 'Failed to generate visual');
      }
    } catch (err) {
      setGenError(err.message || 'Error communicating with visual generation service');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Banner */}
      <div
        style={{
          background: isLowConfidence
            ? 'linear-gradient(135deg, #d97706, #b45309)'
            : 'linear-gradient(135deg, #064e3b, #047857)',
          color: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--elevated-shadow)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          {isLowConfidence ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          <span>{isLowConfidence ? 'Uncertain Identification' : 'Bird Identified'}</span>
        </div>

        <h1 style={{ color: 'white', fontSize: '2.75rem', marginBottom: '0.25rem' }}>
          {bird_name || 'No Bird Detected'}
        </h1>
        {scientific_name && (
          <p style={{ fontStyle: 'italic', color: '#a7f3d0', fontSize: '1.2rem', marginBottom: '1rem' }}>
            {scientific_name}
          </p>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'white',
              color: isLowConfidence ? '#b45309' : 'var(--primary-800)',
              fontWeight: 800,
              fontSize: '1.15rem',
              padding: '0.4rem 1.25rem',
              borderRadius: '9999px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            {confidencePercent}% Confidence
          </div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
            Duration: {recording_duration}s
          </span>
        </div>

        {isLowConfidence && (
          <p
            style={{
              marginTop: '1.25rem',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.92rem',
              color: '#fef3c7',
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* Main Grid: Photo & Ecological Info (shown for all identified birds) */}
      {(bird_name || scientific_name) && status !== 'no_detection' && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2rem', alignItems: 'center' }}>
            {/* Image / Visual Column */}
            <div>
              {currentImageUrl ? (
                <div>
                  <div
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      height: '260px',
                      boxShadow: 'var(--glass-shadow)',
                      background: '#e2e8f0',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={currentImageUrl}
                      alt={bird_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const slug = (scientific_name || bird_info?.scientific_name)
                          ?.toLowerCase()
                          .trim()
                          .replace(/[\s-]+/g, '_');
                        const fallback = `/images/birds/${slug}.jpg`;
                        if (!e.target.src.endsWith(fallback)) {
                          e.target.src = fallback;
                        }
                      }}
                    />
                    {imageMeta && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0.75rem',
                          left: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(6px)',
                          color: '#f8fafc',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Sparkles size={12} color="#34d399" />
                        <span>
                          {imageMeta.provider.includes('gemini') ? 'Gemini AI Visual' : 'AI Generated Visual'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGenerating}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={13} />
                          <span>{generatedImage ? 'Regenerate Visual' : 'Generate with Gemini'}</span>
                        </>
                      )}
                    </button>
                    {bird_info?.in_database && !generatedImage && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--slate-500)' }}>Catalog Photo</span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed #cbd5e1',
                    background: '#f8fafc',
                    height: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <Sparkles size={32} color="var(--primary-600)" style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--slate-800)' }}>
                    No Photo in Local Catalog
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '1rem', maxWidth: '220px' }}>
                    Generate an authentic wildlife visual of this species using Gemini AI.
                  </p>
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating Visual...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate with Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {genError && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#b91c1c', background: '#fee2e2', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  {genError}
                </div>
              )}

              {imageMeta && imageMeta.gemini_status === 'permission_denied' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: '#92400e', background: '#fef3c7', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  Google Gemini reported project permission denied (403). Visual rendered via fallback AI engine.
                </div>
              )}
            </div>

            {/* Ecological / Species Details Column */}
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-success">
                  Family: {bird_info?.family || 'Identified via BirdNET'}
                </span>
                {bird_info?.order && bird_info.order !== 'Uncataloged' && (
                  <span className="badge badge-warning">Order: {bird_info.order}</span>
                )}
                <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                  {bird_info?.conservation_status || 'Bioacoustic Candidate'}
                </span>
              </div>

              <p style={{ color: 'var(--slate-700)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {bird_info?.description ||
                  `Acoustically identified as ${bird_name} (${scientific_name}). This species is cataloged in the global Cornell BirdNET bioacoustic library with ${confidencePercent}% detection confidence.`}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <MapPin size={14} /> Habitat
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-700)' }}>
                    {bird_info?.habitat || 'Global wild distribution'}
                  </div>
                </div>

                <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <Utensils size={14} /> Diet
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-700)' }}>
                    {bird_info?.diet || 'Insects, seeds, or nectar'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {bird_info?.interesting_facts && bird_info.interesting_facts.length > 0 && (
            <div style={{ marginTop: '1.5rem', background: 'var(--primary-50)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-800)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} /> Interesting Facts
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--primary-900)' }}>
                {bird_info.interesting_facts.map((fact, i) => (
                  <li key={i} style={{ marginBottom: '0.2rem' }}>{fact}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Audio Playback & Real Librosa Spectrogram */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Volume2 size={20} color="var(--primary-600)" />
          <span>Audio Playback &amp; Bioacoustic Spectrogram</span>
        </h3>

        {audio_url && (
          <div style={{ marginBottom: '1.5rem' }}>
            <audio controls src={audio_url} style={{ width: '100%' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Streamed securely from private Supabase Storage via time-limited signed URL.
            </p>
          </div>
        )}

        {spectrogram ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--slate-700)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              <Activity size={16} color="var(--primary-600)" />
              <span>Real Mel-Spectrogram (Librosa FFT Analysis)</span>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0f172a', padding: '0.5rem', textAlign: 'center' }}>
              <img
                src={spectrogram}
                alt="Mel-Spectrogram of recording"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Spectrogram preview unavailable.</p>
        )}
      </div>

      {/* Top 5 Predictions Bar Chart */}
      {top_predictions.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--primary-600)" />
            <span>Top Species Candidates (Cornell BirdNET Predictions)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {top_predictions.map((p, idx) => {
              const confPct = Math.round(p.confidence * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    <span>
                      <strong>{p.common_name}</strong>{' '}
                      <span style={{ fontStyle: 'italic', color: 'var(--slate-500)', fontSize: '0.82rem' }}>
                        ({p.scientific_name})
                      </span>
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{confPct}%</span>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${confPct}%`,
                        background:
                          idx === 0
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : 'linear-gradient(90deg, #94a3b8, #64748b)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset CTA */}
      <div style={{ textAlign: 'center', padding: '1rem 0 3rem' }}>
        <button onClick={onReset} className="btn btn-primary btn-lg">
          <RotateCcw size={18} />
          <span>Identify Another Sound</span>
        </button>
      </div>
    </div>
  );
}
