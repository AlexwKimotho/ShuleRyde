const ComingSoon = ({ title }) => (
  <div className="max-w-4xl mx-auto">
    <h1 className="text-2xl font-display font-semibold text-ink mb-2">{title}</h1>
    <div className="bg-white rounded-2xl border border-cloud shadow-sm flex flex-col items-center py-20 text-center">
      <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink mb-2">Coming Soon</h3>
      <p className="text-slate text-sm max-w-xs">This section is under construction and will be available shortly.</p>
    </div>
  </div>
);

export default ComingSoon;
