import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-cloud px-8 py-4 flex items-center justify-between shadow-sm transition-all">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-sage-500 rounded-lg flex items-center justify-center text-xl font-bold text-white">S</div>
    <div>
      <span className="font-display font-semibold text-ink text-lg">ShuleRyde</span>
      <span className="block text-xs text-slate font-medium tracking-wide">School Transport</span>
    </div>
  </div>
  <nav className="hidden md:flex gap-8 items-center">
    <Link to="#features" className="text-slate text-sm font-medium hover:text-sage-600 transition-colors">Features</Link>
    <Link to="#pricing" className="text-slate text-sm font-medium hover:text-sage-600 transition-colors">Pricing</Link>
    <Link to="#cta" className="text-slate text-sm font-medium hover:text-sage-600 transition-colors">Get Started</Link>
  </nav>
  <Link
    to="/signup"
    className="px-5 py-2 rounded-lg bg-sage-500 text-white text-sm font-semibold shadow hover:bg-sage-600 transition-colors"
  >
    Get Started
  </Link>
</header>
<div className="h-20 md:h-20" />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center bg-paper">
  <div className="max-w-3xl mx-auto">
    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-sage-100 border border-sage-200 text-sage-700 text-xs font-semibold uppercase tracking-wide mb-7 animate-fade-in">
      <span className="w-2 h-2 bg-sage-500 rounded-full animate-pulse"></span>
      Now enrolling for Term 3
    </div>
    <h1 className="font-display text-5xl sm:text-6xl font-bold text-ink leading-tight mb-3 animate-fade-in delay-100">
      Modern <span className="text-sage-600 italic">school transport</span><br /> for Nairobi operators
    </h1>
    <p className="font-display text-lg sm:text-xl text-slate max-w-2xl mx-auto mb-8 animate-fade-in delay-200">
      ShuleRyde helps you manage routes, track payments, stay compliant, and keep parents informed — all in one place.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-7 animate-fade-in delay-300">
      <Link
        to="/signup"
        className="px-7 py-3 rounded-xl bg-sage-500 text-white font-semibold text-lg shadow hover:bg-sage-600 transition-colors flex items-center gap-2"
      >
        🚐 Get Started Free
      </Link>
      <Link
        to="/signin"
        className="px-7 py-3 rounded-xl border border-cloud bg-white text-ink font-semibold text-lg hover:bg-paper transition-colors flex items-center gap-2"
      >
        Sign In
      </Link>
    </div>
    <div className="flex flex-wrap gap-4 justify-center items-center text-xs text-slate/80 animate-fade-in delay-400">
      <span className="inline-flex items-center gap-1"><span className="text-green-600">✓</span> NTSA Licensed</span>
      <span className="inline-block w-1 h-1 bg-cloud rounded-full"></span>
      <span className="inline-flex items-center gap-1"><span className="text-green-600">✓</span> PSV Insured</span>
      <span className="inline-block w-1 h-1 bg-cloud rounded-full"></span>
      <span className="inline-flex items-center gap-1"><span className="text-green-600">✓</span> M-Pesa Payment</span>
    </div>
  </div>
</main>

      {/* Features */}
      <section className="bg-white border-t border-cloud py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-ink text-center mb-8">
            Everything you need to run your fleet
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 17l4 4 4-4m-4-5v9m6-10.5A2.5 2.5 0 0016 6H8a2.5 2.5 0 00-2 4.5M12 3v3" />
                  </svg>
                ),
                title: 'Fleet Management',
                desc: 'Track vehicles, routes, and student assignments across your entire fleet.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Payment Tracking',
                desc: 'Manage school fees, record partial payments, and generate professional receipts.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Compliance Tracking',
                desc: 'Never miss a document expiry with built-in alerts for insurance, licenses, and more.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Parent & Student Records',
                desc: 'Keep organised records of parents, students, pickup points, and route assignments.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Expense Tracking',
                desc: 'Log fuel costs, driver salaries, service charges, and traffic fines in one place.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Financial Reports',
                desc: 'Profit & Loss statements, balance sheets, and collection rate summaries.',
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col gap-3 p-5 rounded-xl border border-cloud bg-paper">
                <div className="w-10 h-10 rounded-lg bg-sage-100 text-sage-600 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-ink mb-1">{f.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sage-500 py-12 px-6 text-center">
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          Ready to modernise your fleet?
        </h2>
        <p className="text-white/80 mb-6 text-sm">Join transport operators already using ShuleRyde.</p>
        <Link
          to="/signup"
          className="inline-block px-8 py-3 rounded-xl bg-white text-sage-700 font-semibold text-base hover:bg-paper transition-colors"
        >
          Get Started Free
        </Link>
      </section>

      <footer className="bg-ink py-6 px-6 text-center">
        <p className="text-white/40 text-xs">© {new Date().getFullYear()} ShuleRyde · Homebound Shuttle Ltd</p>
      </footer>
    </div>
  );
};

export default LandingPage;
