import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter, SiteNav } from '@/components/site-shell';
import { services } from '@/lib/data';

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const featuresByService: Record<string, string[]> = {
    'signature-detail': [
      'Two-bucket safe pH-neutral citrus pre-wash and snow foam bath',
      'Wheel barrels, arches and brake calipers deep-cleansed',
      'Iron fallout and road tar decontamination',
      'Gentle hand dry using ultra-soft microfibre plush towels',
      'Full interior vacuum, mat extraction and dust elimination',
      'Leather surfaces cleaned and treated with UV matte protectant',
      'Streak-free interior and exterior crystal glass polish',
      'Hydrophobic 3-month ceramic spray sealant applied to all panels'
    ],
    'paint-correction': [
      'Multi-stage rotary and dual-action machine compounding & polishing',
      'Removal of up to 85-95% of swirl marks, light scratches and marring',
      'Full paint depth measurement and clearcoat safety inspection',
      'Clay bar decontamination of clearcoat and glass surfaces',
      'Panel wipe with isopropyl alcohol to inspect true surface clarity',
      'Deep optical gloss enhancement and mirror reflection restoration',
      'Headlight and tail light micro-polish and clarity boost',
      'Foundation prep ready for long-term ceramic protection'
    ],
    'interior-revival': [
      'Deep hot-water fabric and carpet stain extraction',
      'Steam sanitation of AC vents, console crevices and cup holders',
      'Leather cleansing, stain lifting and rich conditioning balm',
      'Roof headliner gentle dry-sponge stain removal',
      'Door jambs, trunk seals and rubber weatherstripping treated',
      'Anti-bacterial cabin deodorisation and ozone neutraliser',
      'Dashboard, center console and door card UV satin protection',
      'Pedals and footrests scrubbed clean of road grime'
    ],
    'ceramic-protection': [
      'Professional single or multi-stage paint preparation and refinement',
      'Application of 9H high-solids ceramic coating to painted panels',
      'Up to 5-year certified hydrophobic shield against bird droppings & UV',
      'Infrared heat-lamp curing for maximum bonding and glass hardness',
      'Ceramic wheel face protection for easier brake dust rinse-off',
      'Hydrophobic glass sealant applied to windshield and side mirrors',
      'Exterior plastics and trim restored and ceramic coated against fading',
      'Official warranty certificate and maintenance guide provided'
    ]
  };

  const features = featuresByService[service.slug] || [
    'Complete multi-point vehicle inspection',
    'Professional equipment and pH-balanced chemicals',
    'Certified detailing technicians with years of precision experience',
    'Full satisfaction guarantee on surface finish'
  ];

  return (
    <>
      <SiteNav />
      <main className="wrap" style={{ paddingBottom: 80 }}>
        {/* Breadcrumb */}
        <div style={{ paddingTop: 35, fontSize: 13, color: '#687774', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'underline' }}>Home</Link>
          <span>/</span>
          <Link href="/services" style={{ textDecoration: 'underline' }}>Services</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{service.name}</span>
        </div>

        {/* Hero Section */}
        <div className="hero" style={{ padding: '35px 0 50px' }}>
          <div>
            <div className="eyebrow" style={{ color: '#527472', marginBottom: 8 }}>
              {service.category} · {service.duration}
            </div>
            <h1 style={{ margin: '10px 0 20px' }}>
              {service.name} <em>Service</em>
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 540 }}>
              {service.description}
            </p>
            <div style={{ marginTop: 28, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link className="button dark" href={`/booking?service=${service.slug}`} style={{ padding: '15px 28px' }}>
                Book this service from ${service.price} →
              </Link>
              <Link className="button" href="/services" style={{ background: '#e7ede6' }}>
                All services
              </Link>
            </div>
          </div>

          <div
            className="hero-image"
            style={{
              minHeight: 400,
              backgroundImage:
                service.slug === 'paint-correction'
                  ? `url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85')`
                  : service.slug === 'interior-revival'
                  ? `url('https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=85')`
                  : service.slug === 'ceramic-protection'
                  ? `url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85')`
                  : `url('https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85')`
            }}
          >
            <div className="result-tag">
              <b>From ${service.price} AUD</b>
              <br />
              {service.duration} studio or mobile appointment
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, marginTop: 20 }}>
          <section className="panel" style={{ margin: 0 }}>
            <h2 style={{ fontSize: 24, letterSpacing: -1, marginBottom: 18 }}>
              What is included in this package
            </h2>
            <p style={{ color: '#667376', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Every step is executed using specialized automotive restoration equipment, premium pH-neutral detergents, and professional grade finishing compounds.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    background: '#fafcf9',
                    borderRadius: 10,
                    border: '1px solid #eef2ec'
                  }}
                >
                  <span style={{ color: '#1d6960', fontWeight: 800, fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{feat}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar Booking Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="panel" style={{ margin: 0, background: '#102021', color: '#fff' }}>
              <span className="eyebrow" style={{ color: '#c8f25d' }}>Guaranteed Standard</span>
              <h3 style={{ fontSize: 22, margin: '10px 0', letterSpacing: -0.8 }}>Ready to elevate your vehicle?</h3>
              <p style={{ color: '#97a8a4', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                Select an appointment slot online with real-time bay availability and transparent pricing.
              </p>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 18, color: '#c8f25d' }}>
                ${service.price} <span style={{ fontSize: 14, fontWeight: 500, color: '#b2c4c0' }}>AUD (GST Inc.)</span>
              </div>
              <Link
                className="button"
                href={`/booking?service=${service.slug}`}
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', background: 'var(--lime)' }}
              >
                Pre-book this time slot →
              </Link>
            </div>

            <div className="panel" style={{ margin: 0 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 16 }}>Need assistance deciding?</h4>
              <p style={{ color: '#667376', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                Speak directly with one of our master detailers on <b>1300 288 678</b> or visit our Sydney studio.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
