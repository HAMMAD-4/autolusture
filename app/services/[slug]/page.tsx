import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter, SiteNav } from '@/components/site-shell';
import { BookingForm } from '@/components/booking-form';
import { FaqAccordion } from '@/components/faq-accordion';
import { services } from '@/lib/data';

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

/* ── SVG helpers ── */
function IconCheck({ color = '#0d1517' }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const heroImages: Record<string, string> = {
  'paint-correction':   'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85',
  'interior-revival':   'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1400&q=85',
  'ceramic-protection': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85',
  'exterior-detailing': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=85',
  'interior-detailing': 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1400&q=85',
  'paint-protection':   'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=85',
  'ceramic-coating':    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85',
  'maintenance-wash':   'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1400&q=85',
  'signature-detail':   'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=85'
};

const featuresByService: Record<string, string[]> = {
  'signature-detail':   ['Two-bucket safe pH-neutral citrus pre-wash and snow foam bath','Wheel barrels, arches and brake calipers deep-cleansed','Iron fallout and road tar decontamination','Gentle hand dry using ultra-soft microfibre plush towels','Full interior vacuum, mat extraction and dust elimination','Leather surfaces cleaned and treated with UV matte protectant','Streak-free interior and exterior crystal glass polish','Hydrophobic 3-month ceramic spray sealant applied to all panels'],
  'paint-correction':   ['Multi-stage rotary and dual-action machine compounding & polishing','Removal of up to 85-95% of swirl marks, light scratches and marring','Full paint depth measurement and clearcoat safety inspection','Clay bar decontamination of clearcoat and glass surfaces','Panel wipe with isopropyl alcohol to inspect true surface clarity','Deep optical gloss enhancement and mirror reflection restoration','Headlight and tail light micro-polish and clarity boost','Foundation prep ready for long-term ceramic protection'],
  'interior-revival':   ['Deep hot-water fabric and carpet stain extraction','Steam sanitation of AC vents, console crevices and cup holders','Leather cleansing, stain lifting and rich conditioning balm','Roof headliner gentle dry-sponge stain removal','Door jambs, trunk seals and rubber weatherstripping treated','Anti-bacterial cabin deodorisation and ozone neutraliser','Dashboard, center console and door card UV satin protection','Pedals and footrests scrubbed clean of road grime'],
  'ceramic-protection': ['Professional single or multi-stage paint preparation and refinement','Application of 9H high-solids ceramic coating to painted panels','Up to 5-year certified hydrophobic shield against bird droppings & UV','Infrared heat-lamp curing for maximum bonding and glass hardness','Ceramic wheel face protection for easier brake dust rinse-off','Hydrophobic glass sealant applied to windshield and side mirrors','Exterior plastics and trim restored and ceramic coated against fading','Official warranty certificate and maintenance guide provided'],
  'exterior-detailing': ['Contactless high-pressure rinse to remove bulk surface contamination','pH-neutral snow foam pre-soak for safe, swirl-free wash','Two-bucket hand wash using premium sheepskin mitt on all panels','Iron fallout decontamination spray and clay bar surface refinement','Door shuts, fuel cap recess and body seams detail-brushed clean','Streak-free crystal glass polish on all windows and mirrors','Tyre face deep-cleaned and dressed with satin-finish tyre gel','Exterior trim dressed and UV-protected against fading','Panel wipe and 3-month hydrophobic sealant applied as standard finish'],
  'interior-detailing': ['Full cabin deep vacuum including under seat rails and boot lining','Hot-water extraction on all fabric upholstery and floor mats','Steam sanitation of AC vents, steering column and pedal box','Leather seating cleaned, conditioned and UV-protected','Alcantara surfaces gently cleaned with specialist microfibre technique','Centre console, door pockets and cup holders fully detail-brushed','Headliner spot-treated and dry-cleaned as required','Premium ozone deodorisation to eliminate embedded odours'],
  'paint-protection':   ['Pre-installation single-stage paint refinement on all film zones','Bulk Optically Clear TPU film cut by computer-precision plotter','Self-healing top coat activates at ambient temperature over light scratches','Coverage of bonnet, front guards, bumper, mirrors and door edges','Full front end wrap option available on larger vehicles','Hydrophobic coating on film surface for effortless maintenance wash','Certified film carries a 10-year manufacturer warranty against yellowing','Removal is fully paint-safe with zero adhesive staining'],
  'ceramic-coating':    ['Comprehensive paint inspection and single-stage correction pre-coating','Full paint depth logging across all panels for clearcoat safety record','IPA (isopropyl alcohol) panel wipe to strip any residual polishing oils','Application of certified 9H hardness ceramic coating per manufacturer protocol','Infrared heat-lamp curing cycle for crystalline bonding and hardness','Coating applied to glass surfaces for hydrophobic rain-beading effect','Wheel faces, exhaust tips and trim surfaces sealed for full coverage','Warranty certificate, maintenance schedule and aftercare product kit included'],
  'maintenance-wash':   ['Touchless pressure rinse to dislodge loose contaminants safely','pH-neutral foam pre-soak compatible with existing ceramic or PPF coating','Two-bucket hand wash with dedicated wool and microfibre mitts','Wheel faces and brake calipers rinsed and spot-cleaned','Interior quick-vacuum of cabin and boot','Glass surface polish for clarity and streak-free finish','Tyre dressed and exterior trim refreshed','Final coating boost spray to maintain hydrophobic performance']
};

const processByService: Record<string, { step: string; detail: string }[]> = {
  'exterior-detailing': [
    { step: 'Pre-Rinse & Assessment', detail: 'High-pressure contactless rinse with full paint condition assessment before any tool touches the car.' },
    { step: 'Snow Foam Pre-Soak', detail: 'pH-neutral foam dwells on the surface for 5 minutes, lifting loose grit and reducing contact-wash friction.' },
    { step: 'Two-Bucket Hand Wash', detail: 'Safe, swirl-free wash technique using separate wash and rinse buckets with grit guards.' },
    { step: 'Decontamination', detail: 'Iron fallout spray and clay bar treatment remove bonded contamination invisible to the naked eye.' },
    { step: 'Dry, Dress & Seal', detail: 'Heated air blow-dry followed by glass polish, tyre dress, trim protection and 3-month hydrophobic sealant.' }
  ],
  'interior-detailing': [
    { step: 'Full Strip & Vacuum', detail: 'All mats removed and vacuumed flat, followed by deep cabin vacuum including seat rails, boot and parcel shelf.' },
    { step: 'Hot-Water Extraction', detail: 'Industrial extractor pushes heated water through fabric and carpet fibres, pulling stains and bacteria to the surface.' },
    { step: 'Steam Sanitation', detail: 'Steam cleaning of AC vents, switches, steering column and all hard surfaces — kills bacteria and mould spores.' },
    { step: 'Leather & Trim Care', detail: 'Leather surfaces professionally cleaned, stains lifted, balm conditioner applied and UV protectant sealed.' },
    { step: 'Deodorise & Inspect', detail: 'Ozone deodorisation cycle eliminates embedded odours, followed by full quality inspection and sign-off.' }
  ],
  'paint-protection': [
    { step: 'Pre-Film Paint Prep', detail: 'Single-stage machine polish on all film zones to ensure the paint beneath the film is flawless before sealing.' },
    { step: 'Computer Plotter Cut', detail: "Film templates are cut to a precision plotter using your vehicle model's exact panel dimensions." },
    { step: 'Application', detail: 'Panels cleaned with IPA wipe, film aligned with solution, smoothed to zero air pocket and squeegeed flat.' },
    { step: 'Heat Activation', detail: 'Heat gun activates film adhesion and stretches film perfectly around edges and curves without lifting.' },
    { step: 'Curing & Inspection', detail: 'Film cures to full adhesion over 48 hours. Final full-vehicle inspection against direct lighting.' }
  ],
  'ceramic-coating': [
    { step: 'Paint Correction Prep', detail: 'Single or multi-stage machine polish to remove any surface defects before coating locks them in permanently.' },
    { step: 'Paint Depth Recording', detail: 'Digital paint depth gauge used across all panels to log pre-coat clearcoat thickness for warranty records.' },
    { step: 'IPA Wipe & Bond Prep', detail: 'All polishing oils stripped with isopropyl alcohol wipe, leaving a perfectly clean, porous surface for bonding.' },
    { step: 'Ceramic Application', detail: 'Coating applied panel-by-panel under filtered studio lighting, buffed to cross-link as it flashes.' },
    { step: 'IR Cure & Seal', detail: 'Infrared heat-lamp curing accelerates hardness achievement. Glass coating and trim protection applied.' }
  ],
  'maintenance-wash': [
    { step: 'Rinse & Pre-Soak', detail: 'High-pressure contactless rinse followed by coating-safe pH-neutral foam soak.' },
    { step: 'Gentle Hand Wash', detail: 'Two-bucket technique with dedicated wool mitt — no shortcuts that would induce swirl marks on coated paint.' },
    { step: 'Wheels & Details', detail: 'Wheels rinsed, calipers spot-cleaned, door shuts wiped and tyre dressing applied.' },
    { step: 'Coating Boost', detail: 'SiO2-rich spray sealant applied to maintain hydrophobic performance between annual coating sessions.' },
    { step: 'Interior Touch', detail: 'Quick cabin vacuum, glass wipe and any surface dust removed for a fully refreshed result.' }
  ]
};

const defaultProcess = [
  { step: 'Vehicle Assessment',       detail: 'Full condition report before work begins — paint depth, contamination level, prior corrections noted.' },
  { step: 'Surface Decontamination',  detail: 'Iron fallout, tar and bonded contamination safely removed from all surfaces.' },
  { step: 'Core Service Execution',   detail: 'Main service work performed by certified technicians using professional-grade equipment.' },
  { step: 'Quality Inspection',       detail: 'Work reviewed under direct lighting against a strict quality checklist before handover.' },
  { step: 'Client Handover',          detail: 'Result walked through with the client, aftercare guide provided and follow-up scheduled.' }
];

const faqByService: Record<string, { q: string; a: string }[]> = {
  'exterior-detailing': [
    { q: 'How often should I get an exterior detail?', a: "Every 6–8 weeks in Sydney's coastal environment keeps bonded contamination at bay and maintains your paint's condition." },
    { q: 'Will the hand wash cause swirl marks?', a: 'No. We use a strict two-bucket technique with dedicated wool and microfibre mitts and replace them every few panels.' },
    { q: 'Do I need to be present?', a: 'Not at all. We just need keys access. Most clients drop off or have us collect from work.' }
  ],
  'interior-detailing': [
    { q: 'Can you remove old food or pet odours?', a: 'Yes. Hot-water extraction removes embedded organic matter, and our ozone deodorisation cycle eliminates residual odours at a molecular level.' },
    { q: 'Is the hot-water extraction safe on leather?', a: 'We do not use hot-water extraction on leather. Leather receives a specialist dry-cleaning and conditioning process instead.' },
    { q: 'How long does the cabin take to dry?', a: 'We use a heated air gun to accelerate drying. Most vehicles are fully dry within 2–3 hours of collection.' }
  ],
  'ceramic-coating': [
    { q: 'How long does ceramic coating last?', a: 'Our 9H coating carries a 5-year certified warranty with annual maintenance washes. Real-world performance often exceeds this.' },
    { q: 'Do I need paint correction first?', a: 'Strongly recommended. Ceramic coating is permanent and will lock in any existing swirl marks. We include prep correction as standard.' },
    { q: 'Can ceramic coating be removed if I sell the car?', a: 'Coating wears gradually with maintenance washes. It can be machine polished off if required, though most buyers consider it a premium feature.' }
  ],
  'paint-protection': [
    { q: 'Will PPF affect my paint warranty?', a: 'No. Our PPF is fully reversible and does not affect your manufacturer paint warranty. Removal is safe at any point.' },
    { q: 'Is the film visible?', a: 'With quality installation, film edges on flat panels are virtually invisible. Heavily wrapped curved sections may show a very slight edge line.' },
    { q: 'Can I wash my car normally after PPF?', a: 'Yes, after 7 days of curing. We recommend touchless washes or hand washing with pH-neutral shampoos for best results.' }
  ]
};

const defaultFAQ = [
  { q: 'How do I book?', a: 'Use our online booking system below to pick your preferred date and time slot. Confirmation is instant.' },
  { q: 'Do you offer mobile service?', a: 'Yes. We service vehicles at your home or workplace across Sydney Metropolitan, provided adequate shelter is available.' },
  { q: 'What is your satisfaction guarantee?', a: 'If you are not fully satisfied with the result, we will re-address any specific area at no additional charge within 48 hours.' }
];

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const features = featuresByService[service.slug] || ['Complete multi-point vehicle inspection', 'Professional equipment and pH-balanced chemicals', 'Certified detailing technicians', 'Full satisfaction guarantee on surface finish'];
  const process  = processByService[service.slug] || defaultProcess;
  const faq      = faqByService[service.slug] || defaultFAQ;
  const heroImage = heroImages[service.slug] || heroImages['signature-detail'];

  return (
    <>
      <SiteNav />
      <main>
        {/* ── Hero Banner ── dark overlay + car image ── */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 'clamp(280px,40vw,400px)' }}>
          {/* Background car photo */}
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url('${heroImage}')`,
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}
          />
          {/* Dark overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(13,21,23,0.92) 0%, rgba(16,32,33,0.82) 100%)' }} />

          <div className="wrap" style={{ position: 'relative', padding: 'clamp(40px,6vw,70px) 28px clamp(36px,5vw,60px)' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 22, fontSize: 12, color: 'rgba(255,255,255,0.45)', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>Home</Link>
              <IconChevron />
              <Link href="/services" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>Services</Link>
              <IconChevron />
              <span style={{ color: '#fff', fontWeight: 700 }}>{service.name}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(200,242,93,0.12)', border: '1px solid rgba(200,242,93,0.25)', color: '#c8f25d', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 13px', borderRadius: 100 }}>
                {service.category}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#97a8a4', fontSize: 11, fontWeight: 700, padding: '5px 13px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <IconClock /> {service.duration}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(30px,5vw,50px)', fontWeight: 900, letterSpacing: -1.8, margin: '0 0 16px', lineHeight: 1.05, color: '#fff', maxWidth: 640 }}>
              {service.name}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 540, color: 'rgba(255,255,255,0.72)', margin: '0 0 28px' }}>
              {service.description}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#book-now" className="button" style={{ background: '#c8f25d', color: '#0d1517', fontWeight: 800 }}>
                Book from ${service.price} →
              </a>
              <Link href="/services" className="button" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
                All services
              </Link>
            </div>
          </div>
        </div>

        <div className="wrap" style={{ paddingBottom: 80 }}>
          {/* ── Features + Sidebar ── */}
          <div className="svc-detail-layout">
            {/* Features panel — Cream bg & black text */}
            <section
              style={{
                background: '#f5f3ed',
                border: '1px solid #d9ddd6',
                borderRadius: 20,
                padding: 'clamp(22px,3vw,32px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 3, background: '#0d1517', borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1517' }}>
                  What&apos;s included
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,26px)', letterSpacing: -0.8, margin: '8px 0 16px', color: '#0d1517' }}>
                Everything in this package
              </h2>
              <p style={{ color: '#3c4f4c', fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>
                Every step executed using specialised equipment, premium pH-neutral detergents, and professional-grade finishing compounds.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 11,
                      padding: '12px 14px',
                      background: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #d9ddd6'
                    }}
                  >
                    <span style={{ marginTop: 1, flexShrink: 0 }}><IconCheck color="#0d1517" /></span>
                    <span style={{ fontSize: 13.5, color: '#0d1517', lineHeight: 1.5, fontWeight: 600 }}>{feat}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Sidebar — dark */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Price card */}
              <div
                style={{
                  background: '#102021',
                  border: '1px solid rgba(200,242,93,0.2)',
                  borderRadius: 20,
                  padding: '26px 22px',
                  position: 'relative',
                  overflow: 'hidden',
                  color: '#fff'
                }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(200,242,93,0.05)' }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#97a8a4' }}>Starting from</span>
                <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, margin: '8px 0 4px', lineHeight: 1, color: '#c8f25d' }}>
                  ${service.price}
                </div>
                <div style={{ fontSize: 13, color: '#97a8a4', marginBottom: 22 }}>AUD incl. GST · {service.duration}</div>
                <a
                  href="#book-now"
                  style={{
                    display: 'block', width: '100%', padding: '13px', background: '#c8f25d',
                    color: '#0d1517', fontWeight: 800, borderRadius: 12, textDecoration: 'none',
                    textAlign: 'center', fontSize: 14, boxSizing: 'border-box'
                  }}
                >
                  Secure your slot →
                </a>
              </div>

              {/* Trust tiles */}
              {[
                { Icon: IconShield, label: 'Certified technicians only' },
                { Icon: IconUser,   label: '100% satisfaction guarantee' },
                { Icon: IconMapPin, label: 'Mobile or studio, your choice' },
                { Icon: IconClock,  label: 'Real-time slot availability' }
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', gap: 11, alignItems: 'center', padding: '12px 15px',
                    background: '#162224', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12
                  }}
                >
                  <span style={{ color: '#c8f25d', flexShrink: 0 }}><Icon /></span>
                  <span style={{ fontSize: 13, color: '#97a8a4', fontWeight: 600 }}>{label}</span>
                </div>
              ))}

              {/* Contact card */}
              <div style={{ padding: '17px 18px', background: '#162224', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <h4 style={{ margin: '0 0 7px', fontSize: 14, color: '#fff' }}>Need help deciding?</h4>
                <p style={{ color: '#97a8a4', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  Speak with a master detailer on <b style={{ color: '#c8f25d' }}>1300 288 678</b> or visit our Alexandria studio.
                </p>
              </div>
            </div>
          </div>

          {/* ── Our Process ── */}
          <section style={{ marginTop: 68 }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 3, background: '#c8f25d', borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1d6960' }}>How we work</span>
              </div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', letterSpacing: -1, margin: '0 0 10px' }}>Our {service.name} process</h2>
              <p style={{ color: '#667376', fontSize: 14, maxWidth: 500, lineHeight: 1.65 }}>
                A methodical sequence executed in order, every time. No step skipped, no corner cut.
              </p>
            </div>
            <div className="svc-process-grid">
              {process.map((p, idx) => (
                <div key={idx} className="svc-process-card">
                  <div className="process-num">0{idx + 1}</div>
                  <h4 className="process-title">{p.step}</h4>
                  <p className="process-detail">{p.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ — Centered with cream theme & interactive accordion ── */}
          <section style={{ marginTop: 72 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f5f3ed',
                  border: '1px solid #d9ddd6',
                  padding: '6px 14px',
                  borderRadius: 100,
                  marginBottom: 12
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1517' }}>
                  Common questions
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', letterSpacing: -1, margin: '0 0 10px', color: '#0d1517' }}>
                Frequently asked questions
              </h2>
              <p style={{ color: '#667376', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                Everything you need to know about our {service.name} package.
              </p>
            </div>
            <FaqAccordion items={faq} />
          </section>

          {/* ── Booking Form — Follows Home Page CTA scheme ── */}
          <section id="book-now" style={{ marginTop: 76 }}>
            <div
              style={{
                background: '#c8f25d',
                borderRadius: 20,
                padding: 'clamp(28px,4vw,44px) clamp(20px,3vw,40px) clamp(24px,3vw,36px)',
                marginBottom: 32,
                color: '#0d1517',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0d1517', opacity: 0.8, marginBottom: 10 }}>Book online now</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', letterSpacing: -1, margin: '0 0 10px', lineHeight: 1.1, color: '#0d1517' }}>
                Secure your {service.name} slot
              </h2>
              <p style={{ color: '#2b3634', fontSize: 15, maxWidth: 440, margin: '0 auto' }}>
                Real-time availability. Instant confirmation. No deposit required.
              </p>
            </div>
            <BookingForm defaultServiceSlug={service.slug} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
