import React, { useState } from 'react';

export interface BonusData {
  altTitles: string[];
  altDescriptions: string[];
  socialTwitter: string;
  socialLinkedIn: string;
  articleTags: string[];
}

interface BonusPanelProps {
  bonus: BonusData;
  onSelectTitle: (t: string) => void;
  onSelectDesc: (d: string) => void;
  onCopyText: (text: string) => void;
}

export const BonusPanel: React.FC<BonusPanelProps> = ({
  bonus,
  onSelectTitle,
  onSelectDesc,
  onCopyText,
}) => {
  const [activeTab, setActiveTab] = useState<'alternatives' | 'social'>('alternatives');

  const TabButton = ({ id, label }: { id: 'alternatives' | 'social'; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1,
        padding: '0.5rem',
        background: activeTab === id ? 'rgba(99,102,241,0.15)' : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${activeTab === id ? 'var(--primary)' : 'transparent'}`,
        color: activeTab === id ? '#a5b4fc' : 'var(--text-muted)',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );

  const ActionRow = ({ text, onUse, onCopy }: { text: string; onUse?: () => void; onCopy: () => void }) => (
    <div
      style={{
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid var(--border)',
        borderRadius: '0.375rem',
        padding: '0.6rem 0.75rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {text}
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, marginTop: '2px' }}>
        {onUse && (
          <button
            onClick={onUse}
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
              borderRadius: '0.25rem',
              padding: '0.2rem 0.45rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Use
          </button>
        )}
        <button
          onClick={onCopy}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            borderRadius: '0.25rem',
            padding: '0.2rem 0.45rem',
            fontSize: '0.65rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          title="Copy"
        >
          📋
        </button>
      </div>
    </div>
  );

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '0' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <TabButton id="alternatives" label="🤖 AI Alternatives" />
        <TabButton id="social" label="📣 Social Posts" />
      </div>

      <div style={{ padding: '0.875rem' }}>
        {activeTab === 'alternatives' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Alt Titles */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Alternative Titles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {bonus.altTitles.map((t, i) => (
                  <ActionRow
                    key={i}
                    text={t}
                    onUse={() => onSelectTitle(t)}
                    onCopy={() => onCopyText(t)}
                  />
                ))}
              </div>
            </div>

            {/* Alt Descriptions */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Alternative Descriptions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {bonus.altDescriptions.map((d, i) => (
                  <ActionRow
                    key={i}
                    text={d}
                    onUse={() => onSelectDesc(d)}
                    onCopy={() => onCopyText(d)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Twitter */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>𝕏</span> Twitter / X Post
              </div>
              <div style={{ position: 'relative', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.6rem 0.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6, paddingRight: '3rem' }}>
                  {bonus.socialTwitter}
                </p>
                <button
                  onClick={() => onCopyText(bonus.socialTwitter)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc',
                    borderRadius: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Copy Post
                </button>
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: '#0077b5' }}>in</span> LinkedIn Post
              </div>
              <div style={{ position: 'relative', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.6rem 0.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6, paddingRight: '3rem' }}>
                  {bonus.socialLinkedIn}
                </p>
                <button
                  onClick={() => onCopyText(bonus.socialLinkedIn)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc',
                    borderRadius: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Copy Post
                </button>
              </div>
            </div>

            {/* Article Tags */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Article Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {bonus.articleTags.map((tag, i) => (
                  <button
                    key={i}
                    className="tag-badge"
                    onClick={() => onCopyText(tag)}
                    style={{
                      color: '#a5b4fc',
                      borderColor: 'rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.08)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Click to copy"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
