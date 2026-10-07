import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { History as HistoryIcon, Trash2, Volume2, Calendar, AlertTriangle, Eye, Layers } from 'lucide-react';

export default function History() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadHistory = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getHistory(pageNum, 15);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.message || 'Failed to retrieve recording history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(page);
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this identification and its audio file?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteHistoryItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        if (selectedItem?.id === id) setSelectedItem(null);
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown Date';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Recording History</h1>
          <p style={{ color: 'var(--slate-600)' }}>
            Review past sound recordings, replay audio, and inspect bird identification records.
          </p>
        </div>
        <span className="badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
          Total: {total} Recordings
        </span>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--slate-500)' }}>Loading your recording history...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <HistoryIcon size={48} style={{ color: 'var(--slate-400)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Recordings Found</h3>
          <p style={{ color: 'var(--slate-500)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            You haven’t identified any bird sounds yet. Upload or record audio to build your history!
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-600)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Date &amp; File</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Identified Species</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Confidence</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Audio Playback</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLowConf = item.status === 'low_confidence';
                  const confPct = Math.round((item.confidence || 0) * 100);

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid var(--slate-100)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          {formatDate(item.identified_at)}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                          {item.filename} &bull; {item.recording_duration}s
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {item.bird_name || 'No Bird Detected'}
                        </div>
                        {item.scientific_name && (
                          <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                            {item.scientific_name}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${isLowConf ? 'badge-warning' : 'badge-success'}`}>
                          {confPct}%
                        </span>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {item.audio_url ? (
                          <audio
                            controls
                            src={item.audio_url}
                            style={{ height: '32px', width: '220px' }}
                          />
                        ) : (
                          <span style={{ color: 'var(--slate-400)', fontSize: '0.82rem' }}>No audio</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="btn btn-secondary btn-sm"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="btn btn-danger btn-sm"
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--slate-200)' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.88rem', color: 'var(--slate-600)' }}>
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
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
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem' }}>{selectedItem.bird_name}</h2>
                <p style={{ fontStyle: 'italic', color: 'var(--slate-500)' }}>{selectedItem.scientific_name}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span className={`badge ${selectedItem.status === 'low_confidence' ? 'badge-warning' : 'badge-success'}`}>
                {Math.round(selectedItem.confidence * 100)}% Confidence
              </span>
              <span className="badge" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)' }}>
                Duration: {selectedItem.recording_duration}s
              </span>
            </div>

            {selectedItem.audio_url && (
              <div style={{ marginBottom: '1.5rem' }}>
                <audio controls src={selectedItem.audio_url} style={{ width: '100%' }} />
              </div>
            )}

            {selectedItem.top_predictions && selectedItem.top_predictions.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} /> Top Candidates Recorded
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedItem.top_predictions.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', background: 'var(--slate-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span><strong>{p.common_name}</strong> <em>({p.scientific_name})</em></span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{Math.round(p.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setSelectedItem(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
