import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Cell
} from 'recharts';
import {
  LayoutDashboard, Volume2, CheckCircle2, TrendingUp, Feather, Sparkles
} from 'lucide-react';

const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#34d399', '#6ee7b7'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.getStatistics();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load statistics:', err);
        setError(err.message || 'Could not load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--slate-500)' }}>Computing analytics from Supabase...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <span>{error || 'Unable to load statistics.'}</span>
        </div>
      </div>
    );
  }

  const {
    total_recordings,
    successful_identifications,
    average_confidence,
    most_frequent_species,
    distinct_species_count,
    species_distribution = [],
    confidence_distribution = [],
    timeline = [],
  } = stats;

  return (
    <div className="container">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Bioacoustic Analytics Dashboard</h1>
        <p style={{ color: 'var(--slate-600)' }}>
          Real-time metrics, species distribution insights, and identification performance tracking.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Total Recordings</span>
            <div style={{ background: '#ecfdf5', color: 'var(--primary-600)', padding: '0.4rem', borderRadius: '8px' }}>
              <Volume2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>{total_recordings}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Identified Birds</span>
            <div style={{ background: '#d1fae5', color: '#047857', padding: '0.4rem', borderRadius: '8px' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>{successful_identifications}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Average Confidence</span>
            <div style={{ background: '#fef3c7', color: 'var(--accent-500)', padding: '0.4rem', borderRadius: '8px' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            {Math.round(average_confidence * 100)}%
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Distinct Species</span>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.4rem', borderRadius: '8px' }}>
              <Feather size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>{distinct_species_count}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Species Distribution Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Most Frequently Detected Species</h3>
          {species_distribution.length === 0 ? (
            <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', textAlign: 'center', padding: '3rem 0' }}>
              No species records available yet.
            </p>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={species_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]}>
                    {species_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Confidence Range Distribution */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Confidence Score Distribution</h3>
          {confidence_distribution.length === 0 ? (
            <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', textAlign: 'center', padding: '3rem 0' }}>
              No confidence data available yet.
            </p>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidence_distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Identification Activity Over Time</h3>
        {timeline.length === 0 ? (
          <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
            No recordings timeline available.
          </p>
        ) : (
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
