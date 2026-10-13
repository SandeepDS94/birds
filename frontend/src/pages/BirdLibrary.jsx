import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, Info, MapPin, Utensils, Shield, Sparkles, Loader2, RefreshCw } from 'lucide-react';

const getBirdImageUrl = (bird) => {
  if (!bird) return null;
  if (bird.image_url && (bird.image_url.startsWith('/images/') || bird.image_url.startsWith('http'))) {
    return bird.image_url;
  }
  if (bird.scientific_name) {
    const slug = bird.scientific_name.toLowerCase().trim().replace(/[\s-]+/g, '_');
    return `/images/birds/${slug}.jpg`;
  }
  return bird.image_url || null;
};

export default function BirdLibrary() {
  const [birds, setBirds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBird, setSelectedBird] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState(null);

  useEffect(() => {
    async function loadBirds() {
      try {
        const res = await api.getBirds();
        if (res.success && res.data) {
          setBirds(res.data);
        }
      } catch (err) {
        console.error('Failed to load birds:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBirds();
  }, []);

  const handleGenerateModalImage = async () => {
    if (!selectedBird) return;
    setIsGenerating(true);
    setGenMessage(null);
    try {
      const res = await api.generateBirdImage({
        commonName: selectedBird.common_name,
        scientificName: selectedBird.scientific_name,
      });
      if (res?.success && res?.data?.image_url) {
        const updatedImg = res.data.image_url;
        setSelectedBird((prev) => ({ ...prev, image_url: updatedImg }));
        setBirds((prev) =>
          prev.map((b) =>
            b.scientific_name === selectedBird.scientific_name ? { ...b, image_url: updatedImg } : b
          )
        );
        const prov = res.data.provider.includes('gemini') ? 'Gemini AI' : 'AI engine';
        setGenMessage(`Visual generated successfully via ${prov}.`);
      }
    } catch (err) {
      setGenMessage(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredBirds = birds.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.common_name?.toLowerCase().includes(term) ||
      b.scientific_name?.toLowerCase().includes(term) ||
      b.family?.toLowerCase().includes(term) ||
      b.order?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container">
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Species Information Library</h1>
        <p style={{ color: 'var(--slate-600)', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          Explore curated taxonomy, vocalization traits, habitats, and ecological behaviors of native and regional bird species.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.75rem' }}
            placeholder="Search by common name, scientific name, family..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--slate-500)' }}>Loading species catalog...</p>
        </div>
      ) : filteredBirds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--slate-500)' }}>No bird species matched your search query.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredBirds.map((bird) => (
            <div key={bird.id || bird.scientific_name} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {getBirdImageUrl(bird) ? (
                <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
                  <img
                    src={getBirdImageUrl(bird)}
                    alt={bird.common_name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    onError={(e) => {
                      const slug = bird.scientific_name?.toLowerCase().trim().replace(/[\s-]+/g, '_');
                      const fallback = `/images/birds/${slug}.jpg`;
                      if (!e.target.src.endsWith(fallback)) {
                        e.target.src = fallback;
                      }
                    }}
                  />
                </div>
              ) : (
                <div style={{ width: '100%', height: '140px', background: 'linear-gradient(135deg, #064e3b, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Info size={32} />
                </div>
              )}

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>{bird.common_name}</h3>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    {bird.conservation_status?.split(' ')[0] || 'LC'}
                  </span>
                </div>
                <p style={{ fontStyle: 'italic', color: 'var(--slate-500)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                  {bird.scientific_name}
                </p>

                <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginBottom: '1.25rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {bird.description}
                </p>

                <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                    Family: {bird.family}
                  </span>
                  <button onClick={() => setSelectedBird(bird)} className="btn btn-secondary btn-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bird Details Modal */}
      {selectedBird && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem' }}>{selectedBird.common_name}</h2>
                <p style={{ fontStyle: 'italic', color: 'var(--slate-500)', fontSize: '1rem' }}>
                  {selectedBird.scientific_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedBird(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--slate-500)' }}
              >
                &times;
              </button>
            </div>

            {getBirdImageUrl(selectedBird) && (
              <img
                src={getBirdImageUrl(selectedBird)}
                alt={selectedBird.common_name}
                style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}
                onError={(e) => {
                  const slug = selectedBird.scientific_name?.toLowerCase().trim().replace(/[\s-]+/g, '_');
                  const fallback = `/images/birds/${slug}.jpg`;
                  if (!e.target.src.endsWith(fallback)) {
                    e.target.src = fallback;
                  }
                }}
              />
            )}

            <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              {selectedBird.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <MapPin size={16} /> Habitat
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)' }}>{selectedBird.habitat}</div>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <Utensils size={16} /> Diet
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)' }}>{selectedBird.diet}</div>
              </div>
            </div>

            {selectedBird.interesting_facts && selectedBird.interesting_facts.length > 0 && (
              <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-800)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={16} /> Interesting Facts
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--primary-900)' }}>
                  {selectedBird.interesting_facts.map((fact, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {genMessage && (
              <div style={{ marginBottom: '1rem', fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                {genMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleGenerateModalImage}
                disabled={isGenerating}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Generating with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} color="var(--primary-600)" />
                    <span>Generate AI Visual</span>
                  </>
                )}
              </button>
              <button onClick={() => { setSelectedBird(null); setGenMessage(null); }} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
