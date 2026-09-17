'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SiteNav() {
  const [open, setOpen] = useState(false);

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="wrap">
        <nav className="nav">
          <Link className="brand" href="/" onClick={() => setOpen(false)}>
            auto<i>lustre</i>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="navlinks desktop-nav">
            <Link href="/services">Services</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/promotions">Offers</Link>
            <Link href="/about">Our standard</Link>
          </div>

          <div className="nav-actions">
            <Link className="pill desktop-pill" href="/booking">
              Book a detail <span>↗</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile / Tablet Menu Wrapper & Overlay */}
      {open && (
        <div className="mobile-menu-wrapper" role="dialog" aria-modal="true">
          <div className="mobile-backdrop" onClick={() => setOpen(false)} />
          <div className="mobile-drawer">
            <div className="mobile-drawer-head">
              <Link className="brand" href="/" onClick={() => setOpen(false)}>
                auto<i>lustre</i>
              </Link>
              <button
                type="button"
                className="mobile-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mobile-navlinks" onClick={() => setOpen(false)}>
              <Link href="/" className="mobile-navlink">
                Home
              </Link>
              <Link href="/services" className="mobile-navlink">
                Services catalogue
              </Link>
              <Link href="/gallery" className="mobile-navlink">
                Recent work gallery
              </Link>
              <Link href="/promotions" className="mobile-navlink">
                Exclusive offers
              </Link>
              <Link href="/about" className="mobile-navlink">
                Our standard
              </Link>
            </div>

            <div className="mobile-drawer-cta">
              <Link
                className="button dark"
                style={{ width: '100%', justifyContent: 'center', padding: '15px 20px' }}
                href="/booking"
                onClick={() => setOpen(false)}
              >
                Book your detail →
              </Link>
            </div>

            <div className="mobile-staff-section">
              <span className="eyebrow" style={{ display: 'block', marginBottom: 8, color: '#889895' }}>
                Staff & Portals
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link
                  href="/rep"
                  className="button"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '10px', background: '#e9ece6' }}
                  onClick={() => setOpen(false)}
                >
                  Rep portal
                </Link>
                <Link
                  href="/admin"
                  className="button"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '10px', background: '#e9ece6' }}
                  onClick={() => setOpen(false)}
                >
                  Admin portal
                </Link>
              </div>
            </div>

            <div className="mobile-drawer-footer">
              <div>Phone: 1300 288 678</div>
              <div>Sydney Metropolitan & Mobile Studio</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          <div className="brand" style={{ color: '#fff' }}>
            auto<i>lustre</i>
          </div>
          <p style={{ color: '#889895', margin: '8px 0 16px', maxWidth: 320 }}>
            Considered automotive detailing, paint correction and ceramic protection across Sydney.
          </p>
        </div>
        <div style={{ lineHeight: 1.8 }}>
          <b>Studio Operations</b>
          <br />
          © 2026 AutoLustre Detailing Pty Ltd · Sydney, NSW
          <br />
          Privacy Policy · Terms of Service · 1300 288 678
        </div>
      </div>
    </footer>
  );
}
