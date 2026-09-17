'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteNav } from '@/components/site-shell';

interface Review {
  id: number;
  name: string;
  suburb: string;
  vehicle: string;
  service: string;
  category: string;
  rating: number;
  date: string;
  body: string;
}

const reviews: Review[] = [
  { id: 1, name: 'James Hartley', suburb: 'Mosman, NSW', vehicle: '2022 Porsche 911 GT3', service: 'Ceramic Protection', category: 'Ceramic Coating', rating: 5, date: 'August 2025', body: "I've owned six Porsches and taken them to detailers across Sydney, London and Dubai. AutoLustre is on a completely different level. The 911 came back with a depth of gloss I genuinely thought was only achievable through a full respray. The ceramic coating process was meticulous — they spent an entire day on paint prep alone before touching the coating. Worth every cent of the \$899." },
  { id: 2, name: 'Priya Nair', suburb: 'Surry Hills, NSW', vehicle: '2023 BMW M3 Competition', service: 'Paint Correction', category: 'Paint Correction', rating: 5, date: 'July 2025', body: "The M3 had picked up swirl marks from a dodgy car wash, and I was devastated — it had barely 8,000km on it. AutoLustre did a two-stage paint correction and the result is honestly surreal. Under direct sunlight the paint has zero haze. They sent me paint depth readings before and after so I knew exactly how much clearcoat was used. Real professionals." },
  { id: 3, name: 'Oliver Chen', suburb: 'Pyrmont, NSW', vehicle: '2024 Audi RS6 Avant', service: 'Signature Detail', category: 'Full Detail', rating: 5, date: 'September 2025', body: "Booked the Signature Detail for a quarterly reset on the RS6. The booking system is impressively smooth — picked a slot, got a confirmation immediately and the team arrived on time at my workplace in Pyrmont. The interior extraction alone was worth it; they removed a coffee stain from the alcantara headlining I had written off as permanent. Genuinely blown away." },
  { id: 4, name: 'Mia Kowalski', suburb: 'Bondi, NSW', vehicle: '2023 Tesla Model Y Performance', service: 'Paint Protection Film', category: 'Paint Protection', rating: 5, date: 'June 2025', body: "PPF on a Model Y is a must in Sydney traffic and AutoLustre did an invisible job — I genuinely couldn't see the film edges at all. The technician walked me through every zone they were protecting and flagged a couple of existing rock chips I hadn't noticed. Fantastic communication throughout the three-day process." },
  { id: 5, name: 'Thomas Brennan', suburb: 'Cremorne, NSW', vehicle: '2021 Land Cruiser 300 Series', service: 'Interior Detailing', category: 'Interior', rating: 5, date: 'August 2025', body: "The LandCruiser has seen some serious 4WD tracks over the past year and the interior was showing it. AutoLustre did a full interior detail including steam cleaning the roof lining, extracting the carpets, treating all the leather and even cleaning inside the air vents. It smells brand new. My wife thought I'd bought a new car. Outstanding result." },
  { id: 6, name: 'Sophie Ramirez', suburb: 'Newtown, NSW', vehicle: '2022 Mercedes C63 AMG', service: 'Exterior Detailing', category: 'Exterior', rating: 5, date: 'September 2025', body: "Honest, transparent pricing and genuinely exceptional work. Booked the exterior detail before a wedding and the C63 looked better than the day I collected it from the dealership. They spent extra time on the AMG badging and brake caliper faces — didn't charge extra, just did it because they take pride in the result. That's rare." },
  { id: 7, name: 'David Tremaine', suburb: 'Balmain, NSW', vehicle: '2020 Lamborghini Huracán', service: 'Ceramic Protection', category: 'Ceramic Coating', rating: 5, date: 'July 2025', body: "I was cautious about letting anyone near the Huracán after a bad experience at another detailer left a polish burn on a quarter panel. AutoLustre's technician was fully certified, showed me his DA machine settings before starting and kept me updated with photos throughout. The 9H ceramic result is exceptional. I'll be back for the annual maintenance wash without hesitation." },
  { id: 8, name: 'Rachel Nguyen', suburb: 'Crows Nest, NSW', vehicle: '2023 Volvo XC90 Recharge', service: 'Maintenance Wash', category: 'Maintenance', rating: 5, date: 'September 2025', body: "I've been on the AutoLustre monthly maintenance wash plan since getting the ceramic coating done six months ago. Absolutely faultless service every single time — punctual, careful, and they always leave a little note on what they observed during the wash. It's the kind of attention you'd expect at a high-end watch service, not a car wash. Highly recommended." },
  { id: 9, name: 'Marcus Webb', suburb: 'Double Bay, NSW', vehicle: '2024 Ferrari Roma', service: 'Paint Correction', category: 'Paint Correction', rating: 5, date: 'August 2025', body: "The Roma came with micro-scratches from the factory transport — something Ferrari dealers apparently just live with. AutoLustre did a single-stage correction and the paint now genuinely reflects like liquid. They documented every step with time-stamped photos which I appreciated enormously. If you own something special in Sydney, this is the only detailer worth calling." }
];

const categories = ['All', 'Ceramic Coating', 'Paint Correction', 'Full Detail', 'Interior', 'Exterior', 'Paint Protection', 'Maintenance'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0] ? parts[0].slice(0, 2) : 'AL').toUpperCase();
}

export default function ReviewsPage() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? reviews : reviews.filter((r) => r.category === active);

  return (
    <>
      <SiteNav />
      <main>
        {/* ── Hero ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d1517 0%, #102021 60%, #0d2426 100%)',
            color: '#fff',
            padding: 'clamp(48px,8vw,80px) 0 clamp(44px,7vw,72px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -100, right: '8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,242,93,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div className="wrap" style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(200,242,93,0.1)',
                border: '1px solid rgba(200,242,93,0.2)',
                color: '#c8f25d',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '6px 14px',
                borderRadius: 100,
                marginBottom: 20
              }}
            >
              ★ Customer stories &amp; verified results
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,52px)', fontWeight: 900, letterSpacing: -2, margin: '0 0 16px', lineHeight: 1.05 }}>
              4.9★ across{' '}
              <em style={{ color: '#c8f25d', fontStyle: 'italic' }}>380+ reviews.</em>
            </h1>
            <p style={{ color: '#97a8a4', fontSize: 'clamp(14px,2vw,17px)', lineHeight: 1.7, maxWidth: 540, margin: 0 }}>
              Real feedback from Sydney vehicle owners. From weekend Porsches to daily Teslas, the finish speaks for itself.
            </p>
          </div>
        </div>

        <div className="wrap">
          {/* ── Stats Strip ── */}
          <div className="reviews-stats-grid">
            {[
              { value: '4.9 / 5.0', label: 'Overall Rating' },
              { value: '380+', label: 'Total Reviews' },
              { value: '99%', label: 'Would Recommend' },
              { value: '74%', label: 'Repeat Clients' }
            ].map((s) => (
              <div key={s.label} className="reviews-stat-tile">
                <div className="reviews-stat-value">{s.value}</div>
                <div className="reviews-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Filter Tabs ── */}
          <div className="reviews-filter-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`reviews-filter-btn${active === cat ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Reviews Grid ── */}
          <div className="reviews-grid">
            {filtered.map((review) => (
              <div key={review.id} className="review-card">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div className="review-avatar">
                    {getInitials(review.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="review-card-name" style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.name}
                    </div>
                    <div className="review-card-date" style={{ fontSize: 12, marginTop: 2 }}>
                      {review.suburb} · {review.date}
                    </div>
                  </div>
                  <div style={{ color: '#d97706', fontSize: 13, letterSpacing: 1, flexShrink: 0 }}>{'★'.repeat(review.rating)}</div>
                </div>

                {/* Body */}
                <p className="review-card-body" style={{ fontSize: 13.5, lineHeight: 1.72, margin: '0 0 18px', flex: 1 }}>
                  &ldquo;{review.body}&rdquo;
                </p>

                {/* Tags */}
                <div className="review-card-footer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid #d9ddd6', transition: 'border-color 0.25s ease' }}>
                  <span className="review-tag-service">{review.service}</span>
                  <span className="review-tag-vehicle">{review.vehicle}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Footer CTA (Home Page Scheme) ── */}
          <div
            className="cta"
            style={{
              background: '#c8f25d',
              borderRadius: 24,
              padding: 'clamp(36px,5vw,54px)',
              marginBottom: 80,
              color: '#0d1517',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div className="eyebrow" style={{ color: '#0d1517', opacity: 0.8, marginBottom: 8 }}>
                Join 380+ satisfied clients
              </div>
              <h2 style={{ fontSize: 'clamp(26px,3.8vw,38px)', letterSpacing: -1.5, margin: '0 0 10px', lineHeight: 1.1, color: '#0d1517' }}>
                Ready to see the difference?
              </h2>
              <p style={{ color: '#2b3634', fontSize: 15, maxWidth: 500, margin: 0, lineHeight: 1.6 }}>
                Book online in under 3 minutes. Real-time bay availability. Transparent pricing.
              </p>
            </div>
            <Link href="/booking" className="button dark" style={{ background: '#0d1517', color: '#ffffff', padding: '15px 32px', fontSize: 14 }}>
              Book your detail now →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
