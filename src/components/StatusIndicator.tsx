import React from 'react';

interface StatusIndicatorProps {
  isConnected: boolean;
  articleId: string;
  category: string;
  onRefresh: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  articleId,
  category,
  onRefresh,
}) => {
  const borderColor = isConnected
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(245, 158, 11, 0.3)';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0.75rem 1rem',
        borderColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
        {/* Pulsing dot */}
        <div style={{ position: 'relative', width: '16px', height: '16px', flexShrink: 0 }}>
          <div
            className="animate-pulse"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: isConnected
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(245, 158, 11, 0.3)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '4px',
              borderRadius: '50%',
              background: isConnected ? 'var(--accent)' : 'var(--warning)',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isConnected ? (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', lineHeight: 1.3 }}>
                ✓ Editorial CMS Synced
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span
                  className="tag-badge"
                  style={{ borderColor: 'rgba(16,185,129,0.3)', color: 'var(--accent)' }}
                >
                  ID: {articleId}
                </span>
                <span
                  className="tag-badge"
                  style={{ borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                >
                  {category}
                </span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', lineHeight: 1.3 }}>
                ⚡ Awaiting CMS Page Connection
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Open{' '}
                <a
                  href="http://localhost:5173/mock-cms.html"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#a5b4fc', textDecoration: 'underline' }}
                >
                  mock-cms.html
                </a>{' '}
                then click Sync
              </div>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onRefresh}
        title="Sync CMS"
        style={{
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-hover)',
          color: 'var(--text-secondary)',
          borderRadius: '0.375rem',
          padding: '0.4rem 0.65rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
        Sync
      </button>
    </div>
  );
};
