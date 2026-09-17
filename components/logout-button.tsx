'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton({
  style,
  className
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      className={className || 'button'}
      style={{
        background: '#dce6e0',
        color: '#102021',
        fontSize: 12,
        fontWeight: 700,
        padding: '8px 14px',
        border: 0,
        borderRadius: 999,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...style
      }}
      onClick={handleLogout}
      disabled={loggingOut}
      title="Sign out of your account"
    >
      <span>↪</span>
      <span>{loggingOut ? 'Signing out…' : 'Log out'}</span>
    </button>
  );
}
