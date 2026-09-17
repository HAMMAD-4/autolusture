import { SiteFooter, SiteNav } from '@/components/site-shell';
import Link from 'next/link';

export const metadata = {
  title: "About AutoLustre | Sydney's Premier Car Detailing Studio",
  description:
    'AutoLustre was built by detailers who refused to compromise. Learn about our story, our process, our tools and our promise to Sydney vehicle owners.'
};

/* ── Inline SVG icons ── */
function IconAward() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconTool() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconDroplets() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  );
}
function IconMicroscope() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const credentials = [
  { Icon: IconAward, title: 'IDA Certified Detailer', body: 'Internationally recognised certification in paint correction, surface chemistry and professional detailing standards.' },
  { Icon: IconShield, title: 'Gtechniq Certified Installer', body: 'Authorised to apply and warrant Gtechniq ceramic coating systems — one of fewer than 40 studios in Australia to hold this status.' },
  { Icon: IconStar, title: 'Gyeon Master Detailer', body: 'Recognised by Gyeon for demonstrated expertise in surface preparation, coating layering and long-term paint maintenance.' },
  { Icon: IconTarget, title: '4.9★ on Google Reviews', body: 'Maintained consistently across 380+ genuine reviews from verified Sydney vehicle owners over four years.' }
];

const toolCategories = [
  {
    Icon: IconTool,
    category: 'Machine Polishing',
    items: ['FLEX PE 150 Rotary', 'Rupes LHR 21 Mark III DA', 'Rupes Nano iBrid', "Meguiar's DA Microfibre System"],
    note: 'Three-machine arsenal covering aggressive cut on heavily swirled paint through to delicate finishing on exotic clearcoats.'
  },
  {
    Icon: IconLayers,
    category: 'Ceramic & PPF',
    items: ['Gtechniq Crystal Serum Ultra', 'Gyeon Q2 Mohs+', 'STEK DYNOshield PPF', 'Infrared heat-lamp curing rig'],
    note: 'Coatings and film systems with proven durability data, not marketing claims. All carry manufacturer-backed warranties.'
  },
  {
    Icon: IconDroplets,
    category: 'Extraction & Sanitation',
    items: ['Mytee H-12 Heated Extractor', 'Fortador PRO steam cleaner', 'Tornador foam & blow gun', 'Ozone generator (O3 deodorisation)'],
    note: 'Hospital-grade extraction and steam sanitation eliminates bacteria and allergens from cabin surfaces that basic vacuuming never reaches.'
  },
  {
    Icon: IconMicroscope,
    category: 'Measurement & Inspection',
    items: ['Elcometer 456 paint depth gauge', 'Scangrip Nova 2K inspection light', 'Colorimetric contamination strip test', 'pH test strips for chemistry verification'],
    note: 'We measure before and after every correction job. Data-led detailing means no guesswork and a clear record of clearcoat health.'
  },
  {
    Icon: IconDroplets,
    category: 'Water Management',
    items: ['DeionX 180L/hr DI filter system', "Griot's Garage drying blower", 'Gyeon Wet Coat rinse sealant', 'Spotless Water filter for mobile unit'],
    note: "Deionised water is used for all final rinse stages, preventing mineral deposits and water spots Sydney's hard water supply causes on paint."
  },
  {
    Icon: IconZap,
    category: 'Chemistry Standards',
    items: ['pH-neutral wash: 7.0 verified', 'Iron remover: water-activated indicator', 'No silicone: safe for respray', 'Biodegradable decontamination agents'],
    note: 'Every product is pH-verified before application. We do not use products that conflict with subsequent coating or film installation.'
  }
];

export default function About() {
  return (
    <>
      <SiteNav />
      <main>
        {/* ── Hero ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d1517 0%, #102021 55%, #0d2426 100%)',
            color: '#fff',
            padding: 'clamp(48px,8vw,80px) 0 clamp(44px,7vw,72px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -100, right: '12%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,242,93,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,105,96,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div className="wrap" style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(200,242,93,0.12)',
                border: '1px solid rgba(200,242,93,0.25)',
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
              Our philosophy
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,52px)', fontWeight: 900, letterSpacing: -2, margin: '0 0 16px', lineHeight: 1.05 }}>
              Exceptional care is{' '}
              <span style={{ color: '#c8f25d', fontStyle: 'italic' }}>a habit.</span>
            </h1>
            <p style={{ color: '#97a8a4', fontSize: 'clamp(14px,2vw,17px)', lineHeight: 1.7, maxWidth: 560, margin: '0 0 32px' }}>
              AutoLustre was built for owners who see their car as more than transport. We use a precise
              process, clear communication and no rushed shortcuts.
            </p>
            <Link
              href="/booking"
              className="button dark"
              style={{
                background: '#c8f25d',
                color: '#0d1517',
                fontWeight: 800,
                padding: '14px 28px',
                borderRadius: 100,
                fontSize: 14
              }}
            >
              Meet us at your car →
            </Link>
          </div>
        </div>

        <div className="wrap">
          {/* ── Stats Strip ── */}
          <div className="about-stats-grid">
            {[
              { value: '2,800+', label: 'Vehicles restored' },
              { value: '4.9★',   label: 'Average rating' },
              { value: '380+',   label: 'Verified reviews' },
              { value: '8 yrs',  label: 'Sydney experience' }
            ].map((stat, idx) => (
              <div key={stat.label} className="about-stat-tile" style={{ borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div className="about-stat-value">{stat.value}</div>
                <div className="about-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Section 1: Born in Sydney ── */}
          <section style={{ marginBottom: 80 }}>
            <div className="about-story-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#102021',
                    border: '1px solid #102021',
                    color: '#f5f3ed',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '6px 14px',
                    borderRadius: 100,
                    marginBottom: 18
                  }}
                >
                  Our story
                </div>
                <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', letterSpacing: -1.3, margin: '0 0 20px', lineHeight: 1.1, color: '#0d1517' }}>
                  Born in Sydney —{' '}
                  <span style={{ color: '#1d6960', fontStyle: 'italic' }}>driven by craft</span>
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: '#4a5b57', marginBottom: 18 }}>
                  AutoLustre began in a single bay in Alexandria in 2017, founded by two ex-dealership
                  technicians who were tired of watching perfectly good paint destroyed by pressure washes
                  and cheap compounds. The original clients were neighbours, then enthusiast forum members,
                  then Porsche and Ferrari owners word-of-mouth wouldn&rsquo;t let them say no to.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: '#4a5b57', marginBottom: 18 }}>
                  Eight years later, the business has grown to a dedicated 6-bay studio in Alexandria with a
                  mobile fleet servicing across Sydney Metropolitan — but the founding principle hasn&rsquo;t
                  changed. Every vehicle gets the same respect, the same protocol and the same standard of
                  attention whether it&rsquo;s a Mazda 3 or a McLaren.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: '#4a5b57' }}>
                  We hold certification with the International Detailing Association (IDA), Gtechniq Certified
                  Installer status and recognition as a Gyeon Master Detailer — three credentials that require
                  demonstrated competency, not just payment of a membership fee.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {credentials.map(({ Icon, title, body }) => (
                  <div
                    key={title}
                    style={{
                      display: 'flex',
                      gap: 16,
                      padding: '20px',
                      background: '#162224',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 16,
                      alignItems: 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#102021',
                        border: '1px solid rgba(200,242,93,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c8f25d',
                        flexShrink: 0
                      }}
                    >
                      <Icon />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 5, color: '#fff' }}>{title}</div>
                      <div style={{ fontSize: 13, color: '#97a8a4', lineHeight: 1.65 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 2: Studio-Grade Tooling ── */}
          <section style={{ marginBottom: 100 }}>
            <div
              style={{
                background: '#102021',
                borderRadius: 24,
                padding: 'clamp(32px,5vw,60px) clamp(20px,4vw,52px)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
                    marginBottom: 16
                  }}
                >
                  The tools behind the finish
                </div>
                <h2 style={{ fontSize: 'clamp(26px,3.8vw,38px)', letterSpacing: -1.2, margin: '0 0 14px', lineHeight: 1.1, color: '#fff' }}>
                  Studio-grade tooling &amp;{' '}
                  <span style={{ color: '#c8f25d' }}>precision chemistry</span>
                </h2>
                <p style={{ color: '#7da09a', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
                  A professional result is only possible with professional tools. We invest continuously in
                  equipment and chemistry that the industry&rsquo;s best detailers rely on.
                </p>
              </div>

              <div className="about-tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
                {toolCategories.map(({ Icon, category, items, note }) => (
                  <div
                    key={category}
                    style={{
                      background: '#162224',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 18,
                      padding: '24px 22px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#c8f25d', opacity: 0.5 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#102021',
                          border: '1px solid rgba(200,242,93,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#c8f25d',
                          flexShrink: 0
                        }}
                      >
                        <Icon />
                      </div>
                      <h3 style={{ fontSize: 15, margin: 0, color: '#fff', letterSpacing: -0.4, fontWeight: 800 }}>
                        {category}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {items.map((item) => (
                        <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8f25d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span style={{ fontSize: 13, color: '#c4d4d0' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: '#7da09a', lineHeight: 1.65, margin: 0, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Team CTA (Home Page Scheme) ── */}
          <section
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
                Ready when you are
              </div>
              <h2 style={{ fontSize: 'clamp(26px,3.8vw,38px)', letterSpacing: -1.5, margin: '0 0 10px', lineHeight: 1.1, color: '#0d1517' }}>
                Your vehicle deserves AutoLustre.
              </h2>
              <p style={{ color: '#2b3634', fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.65 }}>
                Book a service today and see what a methodical, no-compromise approach to detailing actually looks like.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/booking"
                className="button dark"
                style={{
                  background: '#0d1517',
                  color: '#ffffff',
                  fontWeight: 800,
                  padding: '15px 28px',
                  borderRadius: 100,
                  fontSize: 14
                }}
              >
                Book your detail →
              </Link>
              <Link
                href="/services"
                className="button"
                style={{
                  background: 'rgba(13,21,23,0.1)',
                  color: '#0d1517',
                  fontWeight: 700,
                  padding: '15px 28px',
                  borderRadius: 100,
                  fontSize: 14,
                  border: '1px solid rgba(13,21,23,0.2)'
                }}
              >
                View all services
              </Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
