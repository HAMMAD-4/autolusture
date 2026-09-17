import { SiteFooter, SiteNav } from '@/components/site-shell';
import Link from 'next/link';
import { services } from '@/lib/data';

export const metadata = {
  title: 'Car Detailing Services Sydney | AutoLustre',
  description:
    'From express maintenance washes to full ceramic coating and paint correction. Every AutoLustre service is performed by certified technicians in Sydney.'
};

/* ── Professional SVG icon components ── */
function IconSun() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconDroplet() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
function IconThermometer() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}
function IconLeaf() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34a1 1 0 0 0 1.34 1.41C8.46 19 11 18 12 17c1.52-1.52 3-3 5-8z" />
      <path d="M2 22c1.44-2.89 2-4.53 2-6a6 6 0 0 1 6-6" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const auConditions = [
  { Icon: IconSun,         title: 'UV-Hardened Protection',         body: "Sydney averages 2,630 sunshine hours annually — double London. Every sealant and coating we apply is rated for extreme UV exposure, preventing clearcoat oxidation and colour fade." },
  { Icon: IconDroplet,     title: 'Salt Air Resistance',            body: 'Vehicles within 5km of Sydney Harbour accelerate surface corrosion significantly. Our hydrophobic coatings form a barrier against salt-heavy coastal air.' },
  { Icon: IconDroplet,     title: 'Hard Water Spot Prevention',     body: 'Sydney tap water leaves mineral deposits on paint during air drying. We use filtered deionised water for all final rinse stages to prevent etching.' },
  { Icon: IconThermometer, title: 'Heat-Stable Coatings',           body: 'Western Sydney summer temperatures exceed 45°C. Our ceramic coatings are rated to 1,200°C and will not soften, smear or delaminate in extreme heat.' },
  { Icon: IconLeaf,        title: 'Eucalyptus & Sap Removal',      body: 'Tree sap and eucalyptus resin are among the most aggressive paint contaminants. We carry specialist solvent-safe removal compounds as standard on every job.' },
  { Icon: IconZap,         title: 'Bird Dropping Acid Protection',  body: 'Australia is home to highly acidic bird species that can etch clearcoat in under four hours in direct sun. Ceramic-coated vehicles have a dramatically wider safe removal window.' }
];

export default function Services() {
  return (
    <>
      <SiteNav />
      <main>
        {/* ── Dark Hero ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d1517 0%, #102021 55%, #0d1517 100%)',
            color: '#fff',
            padding: 'clamp(48px,8vw,80px) 0 clamp(44px,7vw,72px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -80, right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,242,93,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div className="wrap" style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(200,242,93,0.1)', border: '1px solid rgba(200,242,93,0.2)',
                color: '#c8f25d', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
                textTransform: 'uppercase', padding: '6px 14px', borderRadius: 100, marginBottom: 20
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8f25d', display: 'inline-block' }} />
              The full menu
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,52px)', fontWeight: 900, letterSpacing: -2, margin: '0 0 16px', lineHeight: 1.05 }}>
              Details with <em style={{ color: '#c8f25d', fontStyle: 'italic' }}>purpose.</em>
            </h1>
            <p style={{ color: '#97a8a4', fontSize: 'clamp(14px,2vw,17px)', lineHeight: 1.7, maxWidth: 540, margin: '0 0 32px' }}>
              Choose a focused refresh or hand us the keys for a deeper transformation. Every detail includes a careful final inspection.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/booking" className="button dark" style={{ background: '#c8f25d', color: '#0d1517' }}>Book now →</Link>
              <a href="#services" className="button" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>View all services</a>
            </div>
          </div>
        </div>

        <div className="wrap">
          {/* ── Service Cards ── */}
          <div id="services" className="services-cards-grid">
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="svc-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span className="svc-card-cat">{s.category}</span>
                  <span className="svc-card-price">${s.price}</span>
                </div>
                <h2 className="svc-card-title">{s.name}</h2>
                <p className="svc-card-desc">{s.description}</p>
                <div className="svc-card-footer">
                  <span className="svc-card-duration">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {s.duration}
                  </span>
                  <span className="svc-card-link">Explore →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── 5-Stage Protocol ── */}
          <section style={{ marginBottom: 72 }}>
            <div
              style={{
                background: '#102021',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: 'clamp(32px,5vw,60px) clamp(24px,4vw,52px)',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(200,242,93,0.04)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8f25d', marginBottom: 14 }}>How we work</div>
                <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', letterSpacing: -1.2, margin: '0 0 14px', lineHeight: 1.1 }}>The AutoLustre 5-Stage Precision Protocol</h2>
                <p style={{ color: '#7da09a', fontSize: 15, lineHeight: 1.7, maxWidth: 580, marginBottom: 36 }}>
                  Every vehicle moves through the same five-stage sequence. No step is optional. No shortcut is taken.
                </p>
                <div className="protocol-grid">
                  {[
                    { num: '01', title: 'Condition Assessment', body: 'Paint depth gauge, contamination test and surface inspection logged before any tool touches the vehicle.' },
                    { num: '02', title: 'Safe Decontamination',  body: 'Iron fallout spray, tar removal and pH-neutral pre-wash dwell — the foundation every detail is built on.' },
                    { num: '03', title: 'Precision Surface Work', body: 'Service-specific treatment: machine correction, extraction, PPF application or ceramic coating.' },
                    { num: '04', title: 'Protection & Sealing',  body: 'Hydrophobic sealant, ceramic spray or coating layer applied to lock in the result.' },
                    { num: '05', title: 'Final Inspection',      body: 'Vehicle reviewed panel-by-panel under direct studio lighting against a 40-point quality checklist.' }
                  ].map((stage) => (
                    <div key={stage.num} className="protocol-card">
                      <div className="stage-num">{stage.num}</div>
                      <h3 className="stage-title">{stage.title}</h3>
                      <p className="stage-body">{stage.body}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 36 }}>
                  <Link href="/booking" className="button" style={{ background: '#c8f25d', color: '#0d1517' }}>Book your precision detail →</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── Australian Conditions ── */}
          <section style={{ marginBottom: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1d6960', marginBottom: 14, display: 'inline-block', background: '#edf7f5', border: '1px solid #9ecec8', padding: '6px 14px', borderRadius: 100 }}>
                Australian-grade care
              </div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', letterSpacing: -1.2, margin: '0 0 14px' }}>Engineered for Australian conditions</h2>
              <p style={{ color: '#667376', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
                Sydney&rsquo;s coastal air, UV intensity and mineral-heavy water create challenges that European chemistry wasn&rsquo;t designed for.
              </p>
            </div>
            <div className="au-conditions-grid">
              {auConditions.map(({ Icon, title, body }) => (
                <div key={title} className="au-condition-card">
                  <div className="au-condition-icon"><Icon /></div>
                  <h3 style={{ fontSize: 16, margin: '0 0 10px', letterSpacing: -0.4, color: '#0d1517' }}>{title}</h3>
                  <p style={{ fontSize: 13.5, color: '#5a7070', lineHeight: 1.7, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer CTA (Home Page Scheme) ── */}
          <section style={{ marginBottom: 80 }}>
            <div className="cta">
              <div>
                <div className="eyebrow">Your next reset</div>
                <h2>Bring back that first-drive feeling.</h2>
              </div>
              <Link className="button dark" href="/booking">
                Make a booking →
              </Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
