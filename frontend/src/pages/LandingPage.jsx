import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

/* ─── tiny SVG helpers ─── */
const IconBus = () => (
  <svg viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
);
const IconMoney = () => (
  <svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
);
const IconGrid = () => (
  <svg viewBox="0 0 24 24"><path d="M17 17H7V7h10v10zM3 9H1V7c0-1.1.9-2 2-2h2v2H3v2zm0 4H1v-2h2v2zm0 4H1v-2h2v2zm0 2v2h2v-2H3zm4 2v-2h2v2H7zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm4-2h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm0-4h-2V3h-2V1h2c1.1 0 2 .9 2 2v2z"/></svg>
);

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [sent, setSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lpRef = useRef(null);

  /* sticky nav */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* scroll reveal */
  useEffect(() => {
    const els = lpRef.current?.querySelectorAll('.reveal') ?? [];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* smooth anchor scroll */
  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="lp" ref={lpRef}>

      {/* ══ NAV ══ */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}${menuOpen ? ' open' : ''}`}>
        <a href="#" className="lp-logo" onClick={scrollTo('top')}>
          <div className="lp-logo-mark"><IconGrid /></div>
          <span className="lp-logo-text">Shule<span>Ryde</span></span>
        </a>
        <button className="lp-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Toggle navigation">
          <span /><span /><span />
        </button>
        <ul className={`lp-nav-links${menuOpen ? ' open' : ''}`}>
          <li><a href="#parents"      onClick={(e) => { scrollTo('parents')(e);      setMenuOpen(false); }}>For Parents</a></li>
          <li><a href="#operators"    onClick={(e) => { scrollTo('operators')(e);    setMenuOpen(false); }}>For Operators</a></li>
          <li><a href="#safety"       onClick={(e) => { scrollTo('safety')(e);       setMenuOpen(false); }}>Safety</a></li>
          <li><a href="#how-it-works" onClick={(e) => { scrollTo('how-it-works')(e); setMenuOpen(false); }}>How It Works</a></li>
          <li><a href="#contact" className="lp-nav-cta" onClick={(e) => { scrollTo('contact')(e); setMenuOpen(false); }}>Enroll Today</a></li>
        </ul>
      </nav>

      {/* ══ HERO ══ */}
      <div id="top" className="lp-hero">
        {/* Left */}
        <div className="lp-hero-left">
          <div className="lp-live-badge">
            <div className="lp-live-dot" />
            <span className="lp-live-text">Live Tracking Active — Nairobi Routes</span>
          </div>

          <h1 className="lp-h1">
            Your child, <em>safe</em> and on time —
            <span className="accent">every single ride.</span>
          </h1>

          <p className="lp-sub">
            ShuleRyde connects parents, schools, and operators on a single intelligent platform.
            GPS-tracked vehicles, verified drivers, and instant alerts — so you always know where your child is.
          </p>

          <div className="lp-actions">
            <a href="#contact" className="lp-btn-primary" onClick={scrollTo('contact')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Enroll Your Child
            </a>
            <Link to="/signin" className="lp-btn-secondary">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Operator Sign In
            </Link>
          </div>

          <div className="lp-trust">
            <div className="lp-trust-avatars">
              <span>JM</span><span>AK</span><span>RN</span><span>SW</span>
            </div>
            <div className="lp-trust-text">
              Trusted by <strong>500+ families</strong> across Nairobi<br />
              4.9 ★ rated by school administrators
            </div>
          </div>
        </div>

        {/* Right — van photo + floating cards */}
        <div className="lp-hero-right">
          <div className="lp-photo-wrap">
            <div className="lp-photo-bg" />

            {/* GPS card */}
            <div className="lp-photo-card lp-card-gps">
              <div className="lp-card-icon"><IconPin /></div>
              <div className="lp-card-label">Live GPS</div>
              <div className="lp-card-value">Live Tracking</div>
              <div className="lp-card-sub">Updated every 10 s</div>
            </div>

            {/* Van photo */}
            <img
              className="lp-photo"
              src="/download.jpg"
              alt="ShuleRyde school transport van — Nairobi"
            />

            {/* Safety card */}
            <div className="lp-photo-card lp-card-safe">
              <div className="lp-card-icon"><IconShield /></div>
              <div className="lp-card-label">NTSA Verified</div>
              <div className="lp-card-value">Safety Certified</div>
              <div className="lp-card-sub">All drivers background-checked</div>
            </div>

            {/* ETA card */}
            <div className="lp-photo-card lp-card-eta">
              <div className="lp-card-icon"><IconClock /></div>
              <div className="lp-card-label">Arrival ETA</div>
              <div className="lp-card-value">07:15 AM</div>
              <div className="lp-card-sub">Langata Route — on schedule</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STATS BAR ══ */}
      <div className="lp-stats">
        {[
          { num: '100%',  label: 'Safety Record',              badge: 'Zero Incidents' },
          { num: '500+',  label: 'Students Transported Daily', badge: 'Nairobi Wide' },
          { num: '98.7%', label: 'On-Time Arrival Rate',       badge: 'This Term' },
          { num: 'NTSA',  label: 'Fully Compliant Fleet',      badge: 'Certified 2024' },
        ].map((s, i) => (
          <div key={s.num} className={`lp-stat reveal${i ? ` d${i}` : ''}`}>
            <div className="lp-stat-num">{s.num}</div>
            <div className="lp-stat-label">{s.label}</div>
            <div className="lp-stat-badge">{s.badge}</div>
          </div>
        ))}
      </div>

      {/* ══ PARENTS ══ */}
      <section id="parents" className="lp-parents">
        <div className="lp-two-col">
          {/* Phone mockup */}
          <div className="lp-mockup-wrap-outer reveal">
            <div className="lp-mockup-wrap">
              <div className="lp-phone">
                <div className="lp-screen">
                  <div className="lp-screen-header">
                    <div className="lp-screen-title">My Child's Ride</div>
                    <div className="lp-screen-live"><span className="lp-screen-live-dot" /> Live</div>
                  </div>
                  <div className="lp-map">
                    <div className="lp-map-road" />
                    <div className="lp-map-road-h" />
                    <div className="lp-bus-pin"><IconBus /></div>
                  </div>
                  <div className="lp-eta-row">
                    <div className="lp-eta-icon"><IconClock /></div>
                    <div>
                      <div className="lp-eta-label">Arrives at school</div>
                      <div className="lp-eta-value">07:18 AM — 6 min away</div>
                    </div>
                  </div>
                  <div className="lp-alert">
                    <div className="lp-alert-dot" />
                    <div className="lp-alert-text">Amara boarded the van at Kileleshwa — 07:04 AM</div>
                  </div>
                </div>
              </div>
              {/* floating side cards */}
              <div className="lp-float-card lp-float-1">
                <div className="lp-mf-icon">🔔</div>
                <div className="lp-mf-label">Pickup Alert</div>
                <div className="lp-mf-value">Sent instantly</div>
              </div>
              <div className="lp-float-card lp-float-2">
                <div className="lp-mf-icon">🛡️</div>
                <div className="lp-mf-label">Driver Verified</div>
                <div className="lp-mf-value">James M.</div>
              </div>
            </div>
          </div>

          {/* Text + feature cards */}
          <div>
            <div className="reveal">
              <div className="lp-tag">For Parents</div>
              <h2 className="lp-h2">Your peace of mind, <em>delivered</em> with every route.</h2>
              <p className="lp-p">From the moment your child boards to the second they arrive, you stay informed. No more anxious waiting — just confidence.</p>
            </div>
            <div className="lp-feat-grid">
              {[
                { icon: <IconPin />,    cls:'fi-g', title:'Live GPS Tracking',          desc:'See the van\'s exact location on your phone, updated every 10 seconds throughout the journey.' },
                { icon: <IconBell />,   cls:'fi-a', title:'Instant Pickup Alerts',      desc:'Get an SMS and app notification the moment your child boards or alights — automatically.' },
                { icon: <IconShield />, cls:'fi-r', title:'Verified Drivers Only',      desc:'Every driver is background-checked, NTSA licensed, and trained in child transport safety protocols.' },
                { icon: <IconMail />,   cls:'fi-s', title:'Parent Communication Hub',   desc:'Message your driver directly, report concerns, or request route changes — all from the app.' },
              ].map((f, i) => (
                <div key={f.title} className={`lp-feat-card reveal d${i + 1}`}>
                  <div className={`lp-feat-icon ${f.cls}`}>{f.icon}</div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ OPERATORS ══ */}
      <section id="operators" className="lp-operators">
        <div className="lp-two-col">
          {/* Text */}
          <div>
            <div className="reveal">
              <div className="lp-tag rust">For Operators</div>
              <h2 className="lp-h2">Run a smarter fleet with <em>less effort.</em></h2>
              <p className="lp-p">ShuleRyde's operator dashboard gives you full visibility over your vehicles, drivers, and revenue — so you grow without the chaos.</p>
            </div>
            <div className="lp-ops-list reveal d1">
              {[
                { icon: <IconPin />,   cls:'fi-g', title:'Automated Routing & Scheduling',   desc:'AI-optimised routes reduce travel time by up to 22% and cut fuel costs across your fleet every term.' },
                { icon: <IconMoney />, cls:'fi-a', title:'M-Pesa Fee Collection',             desc:'Parents pay digitally via M-Pesa. Fees are reconciled automatically and deposited directly to your account.' },
                { icon: <IconDoc />,   cls:'fi-r', title:'Driver & Compliance Reports',       desc:'Monthly safety reports, driver scorecards, and NTSA compliance documents — generated automatically.' },
              ].map(f => (
                <div key={f.title} className="lp-ops-row">
                  <div className={`lp-ops-icon ${f.cls}`}>{f.icon}</div>
                  <div>
                    <div className="lp-ops-title">{f.title}</div>
                    <div className="lp-ops-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini dashboard */}
          <div className="reveal d2">
            <div className="lp-dash">
              <div className="lp-dash-header">
                <div>
                  <div className="lp-dash-title">Fleet Dashboard</div>
                  <div className="lp-dash-sub">Today · Morning Routes</div>
                </div>
                <div className="lp-dash-live"><div className="lp-dash-dot" /> Live</div>
              </div>
              <div className="lp-dash-metrics">
                {[['12','Vans Active'],['97%','On Time'],['KSh 0','Pending Fees']].map(([v,l]) => (
                  <div key={l} className="lp-dm"><div className="lp-dm-val">{v}</div><div className="lp-dm-lbl">{l}</div></div>
                ))}
              </div>
              {[
                { icon:<IconGrid />, ic:'dri-g', name:'Fuel Optimisation',   desc:'AI routing active',       tag:'-22% fuel', tc:'t-g' },
                { icon:<IconClock/>, ic:'dri-a', name:'Automated Routing',   desc:'All 12 routes optimised', tag:'Active',     tc:'t-a' },
                { icon:<IconMoney/>, ic:'dri-r', name:'M-Pesa Collections',  desc:'Term 2 fees',             tag:'KSh 186k',   tc:'t-r' },
              ].map(r => (
                <div key={r.name} className="lp-dash-row">
                  <div className="lp-dr-left">
                    <div className={`lp-dr-icon ${r.ic}`}>{r.icon}</div>
                    <div><div className="lp-dr-name">{r.name}</div><div className="lp-dr-desc">{r.desc}</div></div>
                  </div>
                  <div className={`lp-dr-tag ${r.tc}`}>{r.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SAFETY ══ */}
      <section id="safety" className="lp-safety">
        <div className="lp-safety-header reveal">
          <div className="lp-tag">Safety First</div>
          <h2 className="lp-h2">Built around your child's <em>safety</em></h2>
          <p className="lp-p">Every policy, every feature, and every driver is held to the highest standard. Safety isn't an add-on — it's the foundation.</p>
        </div>
        <div className="lp-safety-grid">
          {[
            { icon:<IconShield />, cls:'sci-g', title:'Background-Verified Drivers', desc:'Every driver undergoes a full DCI background check, NTSA license verification, and our in-house child safety training before their first route.' },
            { icon:<IconCheck />,  cls:'sci-a', title:'NTSA Compliant Fleet',        desc:'All vehicles are inspected, insured, and carry valid NTSA certification. Speed limiters, seat belts, and fire extinguishers are mandatory on every van.' },
            { icon:<IconPin />,    cls:'sci-r', title:'Real-Time Route Monitoring',  desc:'Our operations team watches every active route in real time. If a van deviates or stops unexpectedly, we notify parents and dispatch support immediately.' },
          ].map((c, i) => (
            <div key={c.title} className={`lp-safety-card reveal${i ? ` d${i}` : ''}`}>
              <div className={`lp-sc-icon ${c.cls}`}>{c.icon}</div>
              <div className="lp-sc-title">{c.title}</div>
              <div className="lp-sc-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="lp-hiw">
        <div className="lp-hiw-header reveal">
          <div className="lp-tag">Simple Process</div>
          <h2 className="lp-h2">Up and running in <em>four steps</em></h2>
          <p className="lp-p">From registration to your child's first safe ride — it takes less than 48 hours.</p>
        </div>
        <div className="lp-steps">
          {[
            { n:'01', title:'Register Online',    desc:'Fill in your child\'s school, pickup location, and preferred schedule. Takes under 5 minutes.' },
            { n:'02', title:'Get Matched',        desc:'We assign a verified driver on a route that covers your area and aligns with your school\'s bell times.' },
            { n:'03', title:'Pay via M-Pesa',     desc:'Confirm your term fee securely via M-Pesa. Receive your driver\'s contact and the live tracking link.' },
            { n:'04', title:'Ride with Confidence',desc:'Your child rides safely every day. You track every trip and receive real-time alerts — zero guesswork.' },
          ].map((s, i) => (
            <div key={s.n} className={`lp-step reveal${i ? ` d${i}` : ''}`}>
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section id="contact" className="lp-contact">
        <div className="lp-two-col">
          {/* Left info */}
          <div className="reveal">
            <div className="lp-tag gold">Get Started</div>
            <h2 className="lp-h2 light">Ready to give your child the <em>safest ride</em> in Nairobi?</h2>
            <p className="lp-p light">Fill in the form and our team will get back to you within 24 hours to set up your child's route.</p>
            <div className="lp-ci">
              <div className="lp-ci-row">
                <div className="lp-ci-icon"><IconPhone /></div>
                <div><div className="lp-ci-label">Call or WhatsApp</div><div className="lp-ci-value">+254 700 000 000</div></div>
              </div>
              <div className="lp-ci-row">
                <div className="lp-ci-icon"><IconMail /></div>
                <div><div className="lp-ci-label">Email</div><div className="lp-ci-value">hello@shuleryde.co.ke</div></div>
              </div>
              <div className="lp-ci-row">
                <div className="lp-ci-icon"><IconPin /></div>
                <div><div className="lp-ci-label">Serving Areas</div><div className="lp-ci-value">Westlands · Karen · Langata · Kilimani · Kileleshwa</div></div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lp-form-box reveal d2">
            <div className="lp-form-title">Enroll Your Child</div>
            <div className="lp-form-sub">We'll set up your route within 48 hours of receiving your request.</div>
            <div className="lp-form-row">
              <div className="lp-form-group">
                <label className="lp-form-label">Parent Name</label>
                <input className="lp-form-input" type="text" placeholder="e.g. Grace Wanjiku" />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Phone Number</label>
                <input className="lp-form-input" type="tel" placeholder="+254 7XX XXX XXX" />
              </div>
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Child's School</label>
              <input className="lp-form-input" type="text" placeholder="e.g. Braeburn School, Westlands" />
            </div>
            <div className="lp-form-row">
              <div className="lp-form-group">
                <label className="lp-form-label">Pickup Area</label>
                <input className="lp-form-input" type="text" placeholder="e.g. Kileleshwa" />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Route Type</label>
                <select className="lp-form-select">
                  <option value="">Select route</option>
                  <option>Morning only</option>
                  <option>Afternoon only</option>
                  <option>Both ways</option>
                </select>
              </div>
            </div>
            <div className="lp-form-group">
              <label className="lp-form-label">Notes or Special Requests</label>
              <textarea className="lp-form-textarea" placeholder="e.g. number of children, specific pickup time, gate preferences…" />
            </div>
            <button
              className={`lp-form-btn${sent ? ' sent' : ''}`}
              onClick={() => {
                if (!sent) { setSent(true); }
              }}
            >
              {sent ? "Request Sent! We'll call you within 24 hours." : 'Send Enrollment Request →'}
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div>
            <a href="#" className="lp-footer-logo" onClick={scrollTo('top')}>
              <div className="lp-footer-logo-mark"><IconGrid /></div>
              <span className="lp-footer-logo-text">Shule<span>Ryde</span></span>
            </a>
            <p className="lp-footer-tagline">Safe, punctual, and transparent school transport for families and operators across Nairobi.</p>
            <div className="lp-footer-socials">
              {['Twitter','Facebook','Instagram'].map(s => (
                <a key={s} href="#" className="lp-footer-social" aria-label={s}>
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="lp-footer-col-title">Platform</div>
            <ul className="lp-footer-links">
              {[['#parents','For Parents'],['#operators','For Operators'],['#safety','Safety Standards'],['#how-it-works','How It Works']].map(([h,l]) => (
                <li key={l}><a href={h} onClick={scrollTo(h.slice(1))}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="lp-footer-col-title">Company</div>
            <ul className="lp-footer-links">
              {['About Us','Partner Schools','Careers','Press'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="lp-footer-col-title">Support</div>
            <ul className="lp-footer-links">
              {['Help Centre','WhatsApp Us','Privacy Policy','Terms of Service'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <div className="lp-footer-copy">© {new Date().getFullYear()} ShuleRyde Ltd. All rights reserved. Nairobi, Kenya.</div>
          <div className="lp-footer-bottom-links">
            {['Privacy','Terms','Cookies'].map(l => <a key={l} href="#">{l}</a>)}
          </div>
        </div>
      </footer>

    </div>
  );
}
