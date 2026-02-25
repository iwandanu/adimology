'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TokenStatusIndicator from './TokenStatusIndicator';
import JobStatusIndicator from './JobStatusIndicator';
import StockbitFetchingIndicator from './StockbitFetchingIndicator';
import ThemeToggle from './ThemeToggle';
import PasswordSettingModal from './PasswordSettingModal';
import { Github, Menu, X, GitFork, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppUser } from './UserProvider';

const UPSTREAM_REPO = 'https://github.com/bhaktiutama/adimology';
const FORK_REPO = 'https://github.com/iwandanu/adimology';

const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user } = useAppUser();
  const isAdmin = !!user?.email && user.email.toLowerCase() === 'dimasiwandanu@gmail.com';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="navbar-logo-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="49" y="10" width="2" height="80" fill="currentColor" />
              <rect x="44" y="32" width="12" height="38" fill="currentColor" />
              <path d="M22 30C40 18 60 22 80 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M22 30C18 30 16 38 22 42C24 44 28 42 28 38" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
              <line stroke="currentColor" strokeWidth="1.5" x1="22" x2="44" y1="30" y2="70" />
              <line stroke="currentColor" strokeWidth="1.5" x1="80" x2="56" y1="32" y2="70" />
            </svg>
          </div>
          <div className="navbar-content">
            <h1 className="navbar-title">Iwandanu Stock Tool</h1>
            <p className="navbar-subtitle">Adimology, plus some extra features</p>
          </div>
        </div>

        {/* Desktop View */}
        <div className="nav-desktop-actions">
          <div className="nav-links">
            <Link 
              href="/" 
              style={{
                textDecoration: 'none',
                color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Calculator
            </Link>
            {isAdmin && (
              <>
                <Link 
                  href="/history" 
                  style={{
                    textDecoration: 'none',
                    color: pathname === '/history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: pathname === '/history' ? 600 : 400,
                    fontSize: '0.9rem',
                    borderBottom: pathname === '/history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    paddingBottom: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  History
                </Link>
                <Link 
                  href="/summary" 
                  style={{
                    textDecoration: 'none',
                    color: pathname === '/summary' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: pathname === '/summary' ? 600 : 400,
                    fontSize: '0.9rem',
                    borderBottom: pathname === '/summary' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    paddingBottom: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  Summary
                </Link>
              </>
            )}
            <Link 
              href="/retail-opportunity" 
              style={{
                textDecoration: 'none',
                color: pathname === '/retail-opportunity' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/retail-opportunity' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/retail-opportunity' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Retail Opportunity
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                style={{
                  textDecoration: 'none',
                  color: pathname === '/admin' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: pathname === '/admin' ? 600 : 400,
                  fontSize: '0.8rem',
                  paddingBottom: '2px',
                  transition: 'all 0.2s'
                }}
              >
                Admin
              </Link>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Link 
                href="/advanced-analytics" 
                style={{
                  textDecoration: 'none',
                  color: pathname.startsWith('/advanced-analytics') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: pathname.startsWith('/advanced-analytics') ? 600 : 400,
                  fontSize: '0.9rem',
                  borderBottom: pathname === '/advanced-analytics' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  paddingBottom: '2px',
                  transition: 'all 0.2s'
                }}
              >
                Advanced Analytics
              </Link>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                <Link
                  href="/advanced-analytics/correlation"
                  style={{
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    color: pathname === '/advanced-analytics/correlation' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  Correlation Analysis
                </Link>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
                <Link
                  href="/advanced-analytics/multi-market-screener"
                  style={{
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    color:
                      pathname === '/advanced-analytics/multi-market-screener'
                        ? 'var(--accent-primary)'
                        : 'var(--text-muted)',
                  }}
                >
                  Multi Market Screener
                </Link>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Upstream → Fork"
            >
              <a
                href={UPSTREAM_REPO}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                }}
                title="Upstream: bhaktiutama/adimology"
              >
                <Github size={20} />
              </a>
              <GitFork size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <a
                href={FORK_REPO}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                }}
                title="Fork: iwandanu/adimology"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
          <div className="nav-status-group">
            <StockbitFetchingIndicator />
            <JobStatusIndicator />
            <TokenStatusIndicator />
            <ThemeToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {user ? (
                <>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={user.email || undefined}
                  >
                    {user.email || 'Google user'}
                  </span>
                  <button
                    type="button"
                    onClick={() => supabase.auth.signOut()}
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: window.location.origin },
                    })
                  }
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: '1px solid var(--accent-primary)',
                    background: 'rgba(124, 58, 237, 0.12)',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Connect Google
                </button>
              )}
            </div>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="theme-toggle-btn"
              title="Password Protection"
              style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-primary)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '12px', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Shield size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <button className="nav-mobile-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <div className={`nav-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="nav-links">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/' ? 600 : 400,
                fontSize: '1rem',
                padding: '0.5rem 0',
                transition: 'all 0.2s'
              }}
            >
              Calculator
            </Link>
            {isAdmin && (
              <>
                <Link 
                  href="/history" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    textDecoration: 'none',
                    color: pathname === '/history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: pathname === '/history' ? 600 : 400,
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    transition: 'all 0.2s'
                  }}
                >
                  History
                </Link>
                <Link 
                  href="/summary" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    textDecoration: 'none',
                    color: pathname === '/summary' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: pathname === '/summary' ? 600 : 400,
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    transition: 'all 0.2s'
                  }}
                >
                  Summary
                </Link>
              </>
            )}
            <Link 
              href="/retail-opportunity" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/retail-opportunity' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/retail-opportunity' ? 600 : 400,
                fontSize: '1rem',
                padding: '0.5rem 0',
                transition: 'all 0.2s'
              }}
            >
              Retail Opportunity
            </Link>
            <Link 
              href="/advanced-analytics" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/advanced-analytics' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/advanced-analytics' ? 600 : 400,
                fontSize: '1rem',
                padding: '0.5rem 0',
                transition: 'all 0.2s'
              }}
            >
              Advanced Analytics
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setIsMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: pathname === '/admin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: pathname === '/admin' ? 600 : 400,
                  fontSize: '0.9rem',
                  padding: '0.25rem 0 0.25rem 0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                Admin
              </Link>
            )}
            <Link 
              href="/advanced-analytics/correlation" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/advanced-analytics/correlation' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/advanced-analytics/correlation' ? 600 : 400,
                fontSize: '0.9rem',
                padding: '0.25rem 0 0.25rem 0.75rem',
                transition: 'all 0.2s'
              }}
            >
              Correlation Analysis
            </Link>
            <Link 
              href="/advanced-analytics/multi-market-screener" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/advanced-analytics/multi-market-screener' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/advanced-analytics/multi-market-screener' ? 600 : 400,
                fontSize: '0.9rem',
                padding: '0.25rem 0 0.25rem 0.75rem',
                transition: 'all 0.2s'
              }}
            >
              Multi Market Screener
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
              <a
                href={UPSTREAM_REPO}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}
              >
                <Github size={20} /> bhaktiutama/adimology
              </a>
              <GitFork size={16} style={{ color: 'var(--text-muted)' }} />
              <a
                href={FORK_REPO}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}
              >
                <Github size={20} /> iwandanu/adimology
              </a>
            </div>
          </div>
          <div className="nav-status-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Account</span>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      maxWidth: '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={user.email || undefined}
                  >
                    {user.email || 'Google user'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { supabase.auth.signOut(); setIsMenuOpen(false); }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: window.location.origin },
                    });
                    setIsMenuOpen(false);
                  }}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: '1px solid var(--accent-primary)',
                    background: 'rgba(124, 58, 237, 0.12)',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Connect Google
                </button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Job Status</span>
              <JobStatusIndicator />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Stockbit Token</span>
              <TokenStatusIndicator />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Theme</span>
              <ThemeToggle />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</span>
              <button
                onClick={() => { setIsPasswordModalOpen(true); setIsMenuOpen(false); }}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px'
                }}
              >
                <Shield size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <PasswordSettingModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </nav>
  );
};

export default Navbar;