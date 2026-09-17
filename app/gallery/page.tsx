'use client';

import { useState, useEffect } from 'react';
import { SiteFooter, SiteNav } from '@/components/site-shell';

interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  isLiveDb?: boolean;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data) => {
        if (data.photos) setItems(data.photos);
      })
      .catch((err) => console.error('Failed to load gallery:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SiteNav />
      <main className="wrap">
        <div className="page-hero">
          <div className="eyebrow">Recent work & live finishes</div>
          <h1>
            Proof is in the <em>finish.</em>
          </h1>
          <p>
            A selection of considered transformations and real-time bay completions captured by our certified technicians across Sydney.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#667376' }}>
            ⏳ Loading finish gallery from database…
          </div>
        ) : (
          <div className="gallery-grid" style={{ paddingBottom: 80 }}>
            {items.map((item) => (
              <div key={item.id} className="gallery-card">
                <div
                  className="gallery-image"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(8,17,18,0) 55%, rgba(8,17,18,0.78) 100%), url('${item.image}')`
                  }}
                />
                <div className="result-tag gallery-tag">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{item.title}</span>
                    {item.isLiveDb && (
                      <span
                        style={{
                          background: '#1d6960',
                          color: '#fff',
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 5px',
                          borderRadius: 4
                        }}
                      >
                        LIVE DB
                      </span>
                    )}
                  </div>
                  <small style={{ fontSize: 11, color: '#667376', display: 'block', marginTop: 2 }}>
                    {item.subtitle}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
