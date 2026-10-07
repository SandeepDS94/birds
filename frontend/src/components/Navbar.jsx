import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Volume2, Library, LayoutDashboard, History, Info, LogIn, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-brand">
          <div className="nav-logo-icon">
            <Volume2 size={22} />
          </div>
          <span>AvianAI</span>
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/identify" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Identify Bird
              </NavLink>
            </li>
            <li>
              <NavLink to="/birds" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Bird Library
              </NavLink>
            </li>
            {user && (
              <>
                <li>
                  <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    History
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Dashboard
                  </NavLink>
                </li>
              </>
            )}
            <li>
              <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                About
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="nav-user">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="user-badge" title={user.email}>
                <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                {user.user_metadata?.full_name || user.email.split('@')[0]}
              </span>
              <button onClick={handleSignOut} className="btn btn-secondary btn-sm" title="Log out">
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <LogIn size={15} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
