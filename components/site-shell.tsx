'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  const navLinks = [
    { label: 'HOME', href: '/', active: pathname === '/' },
    { label: 'SERVICES', href: '/services', active: pathname.startsWith('/services') },
    { label: 'ABOUT', href: '/about', active: pathname.startsWith('/about') },
    { label: 'GALLERY', href: '/gallery', active: pathname.startsWith('/gallery') },
    { label: 'REVIEWS', href: '/reviews', active: pathname.startsWith('/reviews') },
  ];

  return (
    <header className="site-header">
      <div className="wrap">
        <nav className="nav">
          {/* Logo on Left */}
          <Link className="brand-logo-link" href="/" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="AutoLustre Premium Car Detailing"
              className="brand-logo-img"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="navlinks desktop-nav">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`navlink-item ${item.active ? 'active' : ''}`}
              >
                {item.label}
                {item.active && <span className="navlink-active-bar" />}
              </Link>
            ))}
          </div>

          {/* Actions on Right */}
          <div className="nav-actions">
            <Link className="book-now-btn desktop-pill" href="/booking">
              BOOK NOW <span>→</span>
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
          <div className="mobile-drawer" style={{ background: '#111c1e', color: '#fff' }}>
            <div className="mobile-drawer-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Link href="/" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="AutoLustre"
                  style={{ height: 38, width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <button
                type="button"
                className="mobile-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                ✕
              </button>
            </div>

            <div className="mobile-navlinks" onClick={() => setOpen(false)}>
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="mobile-navlink"
                  style={{
                    color: item.active ? '#c8f25d' : '#cbd5d2',
                    borderLeft: item.active ? '3px solid #c8f25d' : '3px solid transparent',
                    paddingLeft: 12
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mobile-drawer-cta">
              <Link
                className="book-now-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
                href="/booking"
                onClick={() => setOpen(false)}
              >
                BOOK NOW →
              </Link>
            </div>

            <div className="mobile-drawer-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, color: '#8e9e9b' }}>
              <div>Phone: +61 412 345 678</div>
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
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top-grid">
          {/* Column 1: Brand & Tagline */}
          <div>
            <Link href="/" style={{ display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="AutoLustre Premium Car Detailing"
                style={{ height: 46, width: 'auto', marginBottom: 16, display: 'block', objectFit: 'contain' }}
              />
            </Link>
            <p style={{ color: '#92a4a1', fontSize: 13, lineHeight: 1.65, maxWidth: 300, margin: '0 0 20px' }}>
              Professional car detailing services to keep your vehicle looking its best. Premium care. Lasting shine.
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <div className="footer-column-title">Quick Links</div>
            <div className="footer-accent-bar" />
            <Link href="/" className="footer-link">Home</Link>
            <Link href="/services" className="footer-link">Services</Link>
            <Link href="/about" className="footer-link">About</Link>
            <Link href="/gallery" className="footer-link">Gallery</Link>
          </div>

          {/* Column 3: Our Services */}
          <div>
            <div className="footer-column-title">Our Services</div>
            <div className="footer-accent-bar" />
            <Link href="/services/exterior-detailing" className="footer-link">Exterior Detailing</Link>
            <Link href="/services/interior-detailing" className="footer-link">Interior Detailing</Link>
            <Link href="/services/paint-protection" className="footer-link">Paint Protection</Link>
            <Link href="/services/ceramic-coating" className="footer-link">Ceramic Coating</Link>
            <Link href="/services/maintenance-wash" className="footer-link">Maintenance Wash</Link>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <div className="footer-column-title">Contact Us</div>
            <div className="footer-accent-bar" />
            <div className="footer-contact-item">
              <span style={{ color: '#c8f25d', marginTop: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Sydney, NSW 2000<br />Australia</span>
            </div>
            <div className="footer-contact-item">
              <span style={{ color: '#c8f25d', marginTop: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <a href="tel:+61412345678">+61 412 345 678</a>
            </div>
            <div className="footer-contact-item">
              <span style={{ color: '#c8f25d', marginTop: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <a href="mailto:hello@autolustre.com.au">hello@autolustre.com.au</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div style={{ color: '#728380', fontSize: 12 }}>
            © 2025 AutoLustre. All rights reserved.
          </div>
          <div style={{ color: '#728380', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            CLEANER CARS, HAPPIER JOURNEYS.
          </div>
        </div>
      </div>
    </footer>
  );
}
