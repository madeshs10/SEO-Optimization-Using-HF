import React from 'react';

interface GooglePreviewProps {
  title: string;
  description: string;
  slug: string;
}

export const GooglePreview: React.FC<GooglePreviewProps> = ({ title, description, slug }) => {
  const displayUrl = `globalnewsroom.com › article › ${slug || 'your-article-slug'}`;

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '0.875rem 1rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        Google Search Engine Preview
      </div>

      {/* Google card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          border: '1px solid var(--border)',
        }}
      >
        {/* Breadcrumb row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #d946ef)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}
          >
            GN
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>Global Newsroom</div>
            <div style={{ fontSize: '0.65rem', color: '#4a9eff', lineHeight: 1.2 }}>{displayUrl}</div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '1.05rem',
            color: '#4a9eff',
            fontWeight: 400,
            lineHeight: 1.35,
            marginBottom: '0.25rem',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.textDecoration = 'underline')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.textDecoration = 'none')}
        >
          {title || 'Your SEO Meta Title Will Appear Here'}
        </div>

        {/* Description */}
        <div style={{ fontSize: '0.8rem', color: '#9aa0a6', lineHeight: 1.5 }}>
          {description
            ? description.length > 160
              ? description.slice(0, 157) + '...'
              : description
            : 'Your meta description will appear here. It should be 150-160 characters long and include your focus keyword naturally.'}
        </div>
      </div>

      {/* Char indicators */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        {[
          { label: 'Title', len: title.length, max: 60, ideal: [50, 60] },
          { label: 'Desc', len: description.length, max: 160, ideal: [150, 160] },
        ].map(({ label, len, max, ideal }) => {
          const pct = Math.min((len / max) * 100, 100);
          const color = len === 0 ? 'var(--text-muted)' : len >= ideal[0] && len <= ideal[1] ? 'var(--accent)' : len > ideal[1] ? 'var(--danger)' : 'var(--warning)';
          return (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color }}>{len}/{max}</span>
              </div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
