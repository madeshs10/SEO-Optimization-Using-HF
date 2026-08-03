import React, { useState, useRef } from 'react';

export interface AIOptions {
  tone: string;
  keywords: string[];
  mode: 'english' | 'tamil';
}

interface AIPanelProps {
  onGenerate: (options: AIOptions) => void;
  isGenerating: boolean;
  isDisabled: boolean;
  isTamilArticle?: boolean;
}

const TONES = [
  { id: 'SEO-Optimized', emoji: '🎯', desc: 'Keyword-first' },
  { id: 'Professional', emoji: '📊', desc: 'Authoritative' },
  { id: 'Engaging', emoji: '💬', desc: 'Conversational' },
  { id: 'Clickbait', emoji: '🔥', desc: 'Viral hooks' },
];

export const AIPanel: React.FC<AIPanelProps> = ({
  onGenerate,
  isGenerating,
  isDisabled,
  isTamilArticle = false,
}) => {
  const [engineMode, setEngineMode] = useState<'english' | 'tamil'>(isTamilArticle ? 'tamil' : 'english');
  const [selectedTone, setSelectedTone] = useState('SEO-Optimized');
  const [keywords, setKeywords] = useState<string[]>(['SEO', 'Trending']);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-switch engine mode when active article changes language
  React.useEffect(() => {
    if (isTamilArticle) {
      setEngineMode('tamil');
    } else {
      setEngineMode('english');
    }
  }, [isTamilArticle]);

  const addKeyword = (val: string) => {
    const trimmed = val.trim().replace(/,+$/, '');
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && keywords.length > 0) {
      setKeywords((prev) => prev.slice(0, -1));
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  return (
    <div className="glass-panel" style={{ padding: '1rem' }}>
      {/* Engine & Language Mode Switcher */}
      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Engine & Language Mode
          </label>
          <span style={{ fontSize: '0.62rem', color: isTamilArticle ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
            {isTamilArticle ? '✨ Tamil Article Detected' : '🌐 English Article Detected'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', background: 'var(--bg-card)', padding: '0.2rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setEngineMode('english')}
            style={{
              background: engineMode === 'english' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: engineMode === 'english' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.45rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🇬🇧 English Engine</span>
          </button>
          <button
            type="button"
            onClick={() => isTamilArticle && setEngineMode('tamil')}
            disabled={!isTamilArticle}
            title={!isTamilArticle ? 'Select a Tamil article in CMS to enable Tamil Engine' : 'Tamil Engine active'}
            style={{
              background: engineMode === 'tamil' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: engineMode === 'tamil' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.45rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: isTamilArticle ? 'pointer' : 'not-allowed',
              opacity: isTamilArticle ? 1 : 0.45,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{isTamilArticle ? '🇮🇳 தமிழ் (Tamil)' : '🔒 தமிழ் (Disabled)'}</span>
          </button>
        </div>
      </div>

      {/* Tone Selector */}
      <div style={{ marginBottom: '0.875rem' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
          Writing Tone
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
          {TONES.map((tone) => {
            const active = selectedTone === tone.id;
            return (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                style={{
                  background: active ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.375rem',
                  padding: '0.45rem 0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{tone.emoji}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: active ? '#a5b4fc' : 'var(--text-secondary)', lineHeight: 1 }}>
                  {tone.id}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                  {tone.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keywords */}
      <div style={{ marginBottom: '0.875rem' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
          Focus Keywords
        </label>
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            padding: '0.4rem 0.6rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            alignItems: 'center',
            cursor: 'text',
            minHeight: '40px',
            transition: 'border-color 0.2s ease',
          }}
        >
          {keywords.map((kw) => (
            <span
              key={kw}
              className="tag-badge"
              style={{ color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)' }}
            >
              {kw}
              <button
                onClick={(e) => { e.stopPropagation(); removeKeyword(kw); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1, fontFamily: 'var(--font-sans)' }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (inputVal.trim()) addKeyword(inputVal); }}
            placeholder={keywords.length === 0 ? 'Type keyword, press Enter...' : ''}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              padding: '0',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              minWidth: '80px',
              flex: 1,
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Press Enter or comma to add · Backspace to remove
        </div>
      </div>

      {/* Generate Button */}
      <button
        id="btn-generate-seo"
        className="shiny-button"
        onClick={() => onGenerate({ tone: selectedTone, keywords, mode: engineMode })}
        disabled={isGenerating || isDisabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {isGenerating ? (
          <>
            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            AI Engine Thinking...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            {engineMode === 'tamil' ? 'Optimize Tamil SEO (தமிழ்)' : 'Optimize English SEO'}
          </>
        )}
      </button>

      <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: engineMode === 'tamil' ? 'var(--accent)' : 'var(--warning)', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
        <span style={{ flexShrink: 0 }}>⚡</span>
        <span>
          {engineMode === 'tamil'
            ? 'Tamil Engine (தமிழ்) — Powered by Qwen 2.5 Multilingual LLM'
            : 'English Engine — Powered by HuggingFace LLM'}
        </span>
      </div>
    </div>
  );
};
