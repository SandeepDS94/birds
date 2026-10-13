import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          <strong>AvianAI</strong> &copy; {new Date().getFullYear()} &mdash;  Bird Sound Identification &amp; Species Information System.
        </p>
        <p style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>
          Powered by   || 2026
        </p>
      </div>
    </footer>
  );
}
