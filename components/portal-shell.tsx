'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './logout-button';

const adminNav = [
  ['/portal/admin', 'Overview'],
  ['/portal/admin/bookings', 'Bookings'],
  ['/portal/admin/active', 'Active jobs'],
  ['/portal/admin/representatives', 'Representatives'],
  ['/portal/admin/services', 'Services & offers'],
  ['/portal/admin/inventory', 'Inventory'],
  ['/portal/admin/bill-customize', 'Bill Customize'],
  ['/portal/admin/analytics', 'Analytics'],
  ['/portal/admin/profile', 'Admin Profile']
];

const repNav = [
  ['/portal/rep', 'Today'],
  ['/portal/rep/bookings', 'Upcoming bookings'],
  ['/portal/rep/on-arrival', 'New on-arrival'],
  ['/portal/rep/active', 'Active service'],
  ['/portal/rep/history', 'Customer history'],
  ['/portal/rep/performance', 'Performance']
];

interface CurrentUserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function PortalShell({
  role,
  children
}: {
  role: 'admin' | 'rep';
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);
  const items = role === 'admin' ? adminNav : repNav;

  // Fetch live signed-in user details from DB
  useEffect(() => {
    try {
      const cached = localStorage.getItem(`autolustre_user_${role}`);
      if (cached) setCurrentUser(JSON.parse(cached));
    } catch {}

    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          try {
            localStorage.setItem(`autolustre_user_${role}`, JSON.stringify(data.user));
          } catch {}
        }
      })
      .catch(() => {});
  }, [role]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="portal">
      {/* Desktop & Tablet Sidebar */}
      <aside className="side">
        <Link className="brand" href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', margin: '0 10px 24px' }}>
          <Image
            src="/logo.png"
            alt="AutoLustre"
            width={58}
            height={58}
            priority
            style={{ objectFit: 'contain', display: 'block', width: 'auto', height: 48 }}
          />
        </Link>
        <div style={{ margin: '0 10px 14px' }}>
          <span
            className="eyebrow"
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: 6,
              color: '#dbe7e3'
            }}
          >
            {role === 'admin' ? '🛡 Admin Portal' : '🔧 Field Rep Portal'}
          </span>
        </div>

        {/* Live Signed-in User Identity Card from DB */}
        <div
          style={{
            margin: '0 8px 18px',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: role === 'admin' ? '#1d6960' : '#243c3d',
              border: '1.5px solid #c8f25d',
              color: '#fff',
              display: 'grid',
              placeContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            {(currentUser?.full_name || (role === 'admin' ? 'A' : 'R'))[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={currentUser?.full_name}
            >
              {currentUser?.full_name || 'Loading profile…'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#a0b4af',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={currentUser?.email}
            >
              {currentUser?.email || (role === 'admin' ? 'Administrator' : 'Field Representative')}
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(([href, label]) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className={isActive ? 'active' : ''}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 28, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Link href="/" style={{ fontSize: 12, color: '#8b9d98', display: 'block', marginBottom: 12 }}>
            ← Return to public site
          </Link>
          <LogoutButton style={{ width: '100%', justifyContent: 'center', background: '#243c3d', color: '#fff' }} />
        </div>
      </aside>

      {/* Main Portal Viewport */}
      <div style={{ minWidth: 0, width: '100%' }}>
        {/* Mobile Navigation Header (Only on mobile screens) */}
        <header className="portal-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link className="brand" href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <Image
                src="/logo.png"
                alt="AutoLustre"
                width={36}
                height={36}
                priority
                style={{ objectFit: 'contain', display: 'block', width: 'auto', height: 32 }}
              />
            </Link>
            <span
              className="eyebrow"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '3px 8px',
                borderRadius: 6,
                color: '#dbe7e3',
                fontSize: 10
              }}
            >
              {role === 'admin' ? '🛡 Admin' : '🔧 Rep'}
            </span>
          </div>

          <button
            type="button"
            className="portal-mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {menuOpen ? '✕ Close' : '☰ Menu'}
          </button>
        </header>

        {/* Mobile Menu Wrapper Drawer (Modal Dialog) */}
        {menuOpen && (
          <div className="portal-mobile-menu-wrapper" role="dialog" aria-modal="true">
            <div className="portal-mobile-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="portal-mobile-drawer">
              <div className="portal-mobile-drawer-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Image
                    src="/logo.png"
                    alt="AutoLustre"
                    width={44}
                    height={44}
                    priority
                    style={{ objectFit: 'contain', display: 'block', width: 'auto', height: 38 }}
                  />
                  <div style={{ fontSize: 12, color: '#8b9d98', fontWeight: 600 }}>
                    {role === 'admin' ? '🛡 Studio Administrator' : '🔧 Field Detailing Representative'}
                  </div>
                </div>
                <button
                  type="button"
                  className="portal-mobile-close-btn"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="portal-mobile-user-card">
                <div style={{ fontSize: 10, color: '#889995', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
                  Signed In {role === 'admin' ? 'Administrator' : 'Field Technician'}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginTop: 3 }}>
                  {currentUser ? currentUser.full_name : 'Loading profile…'}
                </div>
                <div style={{ fontSize: 12, color: '#dce8e4', marginTop: 2 }}>
                  {currentUser?.email || (role === 'admin' ? 'Administrator' : 'Representative')}
                </div>
              </div>

              <nav className="portal-mobile-navlinks">
                {items.map(([href, label]) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`portal-mobile-navlink ${isActive ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{label}</span>
                      {isActive && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#c8f25d' }}>●</span>}
                    </Link>
                  );
                })}
              </nav>

              <div className="portal-mobile-drawer-footer">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#dce8e4',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 10,
                    textDecoration: 'none'
                  }}
                >
                  ← Return to public website
                </Link>
                <LogoutButton
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '13px',
                    background: '#be4635',
                    color: '#fff',
                    borderRadius: 10,
                    fontSize: 13
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Top Header Bar (Hidden on Mobile) */}
        <div className="portal-desktop-topbar">
          <div>
            Logged in as{' '}
            <b>
              {currentUser?.full_name
                ? `${currentUser.full_name} (${role === 'admin' ? 'Administrator' : 'Field Representative'})`
                : role === 'admin'
                ? 'Administrator'
                : 'Field Representative'}
            </b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Public website
            </Link>
            <span>|</span>
            <LogoutButton />
          </div>
        </div>

        <main className="main">{children}</main>
      </div>
    </div>
  );
}
