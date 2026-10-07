import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';

const STEPS = [
  'Audio uploaded',
  'Audio processed',
  'Analyzing sound with AI',
  'Identifying species',
  'Saving to Supabase',
  'Loading bird information',
];

export default function AnalysisProgress() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
      <div style={{
        width: '56px',
        height: '56px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid var(--primary-500)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1.5rem',
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analyzing bird sound...</h2>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem', marginBottom: '2rem' }}>
        Running Cornell BirdNET neural network inference on audio spectrum
      </p>

      {/* Step checklist */}
      <div style={{ maxWidth: '340px', margin: '0 auto', textAlign: 'left' }}>
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
                color: isDone ? 'var(--primary-700)' : isCurrent ? 'var(--slate-900)' : 'var(--slate-400)',
                fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                fontSize: '0.92rem',
                transition: 'all 0.3s ease',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={18} color="var(--primary-600)" style={{ flexShrink: 0 }} />
              ) : isCurrent ? (
                <CircleDashed size={18} color="var(--primary-500)" style={{ flexShrink: 0, animation: 'spin 2s linear infinite' }} />
              ) : (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1', flexShrink: 0 }} />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
