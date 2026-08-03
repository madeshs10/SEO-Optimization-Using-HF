import React, { useState } from 'react';

export interface SEOData {
  metaTitle: string;
  metaDesc: string;
  slug: string;
  focusKeyword: string;
  relatedKeywords: string;
  imageAlt: string;
}

interface SEOComparisonProps {
  existing: SEOData;
  improved: SEOData;
  onApply: (data: SEOData) => void;
  isApplying: boolean;
  onShowToast: (msg: string) => void;
}

function isLegitContent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // 1. Check for repeated single characters (e.g. "nnnnnnnn")
  if (/(.)\1{5,}/.test(trimmed)) return false;

  // 2. Check unique character ratio for texts longer than 20 chars
  const uniqueChars = new Set(trimmed.toLowerCase()).size;
  if (trimmed.length > 20 && uniqueChars / trimmed.length < 0.15) return false;

  // 3. Check for word spacing on longer text strings (> 35 chars must have multiple words)
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (trimmed.length > 35 && words.length < 3) return false;

  // 4. Reject unrealistically long words (> 28 chars without spaces)
  const maxWordLen = Math.max(...words.map((w) => w.length), 0);
  if (maxWordLen > 28) return false;

  return true;
}

function calcSEOScore(d: SEOData): number {
  let score = 0;

  const isTitleLegit = isLegitContent(d.metaTitle);
  const isDescLegit = isLegitContent(d.metaDesc);
  const isSlugLegit = isLegitContent(d.slug);
  const isAltLegit = isLegitContent(d.imageAlt);

  // 1. Meta Title Score (max 25 pts)
  if (isTitleLegit) {
    const tl = d.metaTitle.length;
    score += tl >= 50 && tl <= 60 ? 25 : tl >= 30 ? 12 : 5;
  }

  // 2. Meta Description Score (max 25 pts)
  if (isDescLegit) {
    const dl = d.metaDesc.length;
    score += dl >= 150 && dl <= 160 ? 25 : dl >= 100 ? 12 : 5;
  }

  // 3. URL Slug Score (max 15 pts)
  if (isSlugLegit) {
    score += /^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug) ? 15 : 5;
  }

  // 4. Focus Keyword Match Score (max 15 pts)
  const fk = d.focusKeyword.trim().toLowerCase();
  if (fk && isLegitContent(fk)) {
    if (isTitleLegit && d.metaTitle.toLowerCase().includes(fk)) score += 5;
    if (isDescLegit && d.metaDesc.toLowerCase().includes(fk)) score += 5;
    if (isSlugLegit && d.slug.toLowerCase().includes(fk.replace(/\s+/g, '-'))) score += 5;
  }

  // 5. Related Keywords Score (max 10 pts)
  const kwList = d.relatedKeywords.split(',').map((k) => k.trim()).filter((k) => isLegitContent(k));
  score += Math.min(kwList.length * 2, 10);

  // 6. Image Alt Text Score (max 10 pts)
  if (isAltLegit) {
    const al = d.imageAlt.length;
    score += al >= 30 && al <= 125 ? 10 : 4;
  }

  return Math.min(score, 100);
}

const FIELDS: { key: keyof SEOData; label: string; type: 'input' | 'textarea'; maxLen?: number; hint?: string }[] = [
  { key: 'metaTitle', label: 'Meta Title', type: 'input', maxLen: 60, hint: '50-60 chars ideal' },
  { key: 'metaDesc', label: 'Meta Description', type: 'textarea', maxLen: 160, hint: '150-160 chars ideal' },
  { key: 'slug', label: 'URL Slug', type: 'input', hint: 'lowercase-with-hyphens' },
  { key: 'focusKeyword', label: 'Focus Keyword', type: 'input' },
  { key: 'relatedKeywords', label: 'Related Keywords', type: 'input', hint: 'comma-separated' },
  { key: 'imageAlt', label: 'Image Alt Text', type: 'input', hint: '30-125 chars ideal' },
];

export const SEOComparison: React.FC<SEOComparisonProps> = ({
  existing,
  improved,
  onApply,
  isApplying,
  onShowToast,
}) => {
  const [editingField, setEditingField] = useState<keyof SEOData | null>(null);
  const [editedData, setEditedData] = useState<SEOData>({ ...improved });

  const existingScore = calcSEOScore(existing);
  const improvedScore = calcSEOScore(editedData);
  const delta = improvedScore - existingScore;

  const getScoreColor = (score: number) =>
    score >= 80 ? 'var(--accent)' : score >= 55 ? 'var(--warning)' : 'var(--danger)';

  const copyAll = async () => {
    const text = [
      `Meta Title: ${editedData.metaTitle}`,
      `Meta Description: ${editedData.metaDesc}`,
      `Slug: ${editedData.slug}`,
      `Focus Keyword: ${editedData.focusKeyword}`,
      `Related Keywords: ${editedData.relatedKeywords}`,
      `Image Alt: ${editedData.imageAlt}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    onShowToast('All fields copied to clipboard!');
  };

  const validateField = (key: keyof SEOData, val: string): 'good' | 'warn' | 'empty' => {
    if (!val) return 'empty';
    if (key === 'metaTitle') return val.length >= 50 && val.length <= 60 ? 'good' : 'warn';
    if (key === 'metaDesc') return val.length >= 150 && val.length <= 160 ? 'good' : 'warn';
    if (key === 'slug') return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val) ? 'good' : 'warn';
    return 'good';
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '1rem' }}>
      {/* Score Widget */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          SEO Score Impact
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(existingScore) }}>{existingScore}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Existing</div>
            <div className="metric-bar" style={{ marginTop: '4px' }}>
              <div className="metric-fill" style={{ width: `${existingScore}%`, background: getScoreColor(existingScore) }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: delta > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(improvedScore) }}>{improvedScore}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>Optimized</div>
            <div className="metric-bar" style={{ marginTop: '4px' }}>
              <div className="metric-fill" style={{ width: `${improvedScore}%`, background: getScoreColor(improvedScore) }} />
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate title warning */}
      {editedData.metaTitle === existing.metaTitle && existing.metaTitle && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--warning)', marginBottom: '0.75rem' }}>
          ⚠️ AI title matches existing — no change detected
        </div>
      )}

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem' }}>
        {FIELDS.map(({ key, label, type, maxLen, hint }) => {
          const val = editedData[key];
          const status = validateField(key, val);
          const isEditing = editingField === key;
          const isRelated = key === 'relatedKeywords';

          return (
            <div key={key} className="compare-box improved">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
                  {hint && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>({hint})</span>}
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '0 0.3rem',
                    borderRadius: '9999px',
                    background: status === 'good' ? 'rgba(16,185,129,0.1)' : status === 'warn' ? 'rgba(245,158,11,0.1)' : 'transparent',
                    color: status === 'good' ? 'var(--accent)' : status === 'warn' ? 'var(--warning)' : 'var(--text-muted)',
                  }}>
                    {status === 'good' ? '✓ Valid' : status === 'warn' ? '⚠ Check' : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {maxLen && !isEditing && (
                    <span style={{ fontSize: '0.6rem', color: val.length > maxLen ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {val.length}/{maxLen}
                    </span>
                  )}
                  <button
                    onClick={() => setEditingField(isEditing ? null : key)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px', fontFamily: 'var(--font-sans)' }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(val);
                      onShowToast(`${label} copied!`);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px', fontFamily: 'var(--font-sans)' }}
                    title="Copy"
                  >
                    📋
                  </button>
                </div>
              </div>

              {isEditing ? (
                type === 'textarea' ? (
                  <textarea
                    value={val}
                    onChange={(e) => setEditedData((prev) => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.8rem' }}
                  />
                ) : (
                  <input
                    value={val}
                    onChange={(e) => setEditedData((prev) => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                )
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {isRelated ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {val.split(',').filter(Boolean).map((kw, i) => (
                        <span key={i} className="tag-badge" style={{ color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)' }}>
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    val || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={copyAll}
          style={{
            flex: 1,
            padding: '0.625rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hover)',
            borderRadius: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          📋 Copy All
        </button>
        <button
          id="btn-apply-to-cms"
          onClick={() => onApply(editedData)}
          disabled={isApplying}
          style={{
            flex: 2,
            padding: '0.625rem',
            background: isApplying ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.15)',
            border: '1px solid var(--accent)',
            borderRadius: '0.5rem',
            color: 'var(--accent)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: isApplying ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            boxShadow: isApplying ? 'none' : 'var(--glow-emerald)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          {isApplying ? (
            <>
              <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Applying...
            </>
          ) : (
            '✓ Apply to CMS'
          )}
        </button>
      </div>
    </div>
  );
};
