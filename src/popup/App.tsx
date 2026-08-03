import { useState, useEffect, useCallback } from 'react';
import { StatusIndicator } from '../components/StatusIndicator';
import { AIPanel, AIOptions } from '../components/AIPanel';
import { GooglePreview } from '../components/GooglePreview';
import { SEOComparison, SEOData } from '../components/SEOComparison';
import { BonusPanel, BonusData } from '../components/BonusPanel';
import { generateSEOWithHuggingFace } from '../lib/huggingface';

interface ScrapedArticle {
  articleId: string;
  title: string;
  content: string;
  category: string;
  existingMetaTitle: string;
  existingMetaDesc: string;
  existingSlug: string;
  existingFocusKeyword: string;
  existingRelatedKeywords: string;
  existingImageAlt: string;
  error?: string;
}

const MOCK_ARTICLE: ScrapedArticle = {
  articleId: 'ART-001',
  title: 'The Rise of Generative AI in Local Journalism',
  content:
    'Local newsrooms across the country are beginning to experiment with generative AI tools to augment their reporting capabilities. From automated summaries of city council meetings to AI-assisted fact-checking pipelines, the technology is reshaping how smaller publications manage their editorial workflow. While large outlets have had access to expensive AI solutions for years, the democratization of open-source models like Mistral and LLaMA is enabling community newspapers and regional broadcasters to level the playing field. Journalists report mixed feelings — some see AI as a tool that frees them for deeper investigation, while others worry about job displacement and the erosion of the human voice in storytelling.',
  category: 'Technology',
  existingMetaTitle: 'AI in Journalism 2024',
  existingMetaDesc: 'AI is changing local news.',
  existingSlug: 'ai-journalism',
  existingFocusKeyword: 'generative AI journalism',
  existingRelatedKeywords: 'AI news, newsroom technology',
  existingImageAlt: 'Journalist using AI tools',
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedArticle | null>(null);
  const [improvedData, setImprovedData] = useState<SEOData | null>(null);
  const [bonusData, setBonusData] = useState<BonusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncCMSData = useCallback(async () => {
    setError(null);
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) { setIsConnected(false); return; }
        chrome.tabs.sendMessage(tab.id, { action: 'GET_ARTICLE_DETAILS' }, (response) => {
          if (chrome.runtime.lastError || !response || response.error) {
            setIsConnected(false);
          } else {
            setIsConnected(true);
            setScrapedData(response as ScrapedArticle);
          }
        });
      } catch {
        setIsConnected(false);
      }
    } else {
      // Sandbox / dev mode — use mock data
      setIsConnected(true);
      setScrapedData(MOCK_ARTICLE);
    }
  }, []);

  useEffect(() => {
    syncCMSData();

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message: { action: string; data: ScrapedArticle }) => {
        if (message.action === 'ARTICLE_CHANGED' && message.data) {
          setScrapedData(message.data);
          setImprovedData(null);
          setBonusData(null);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [syncCMSData]);

  const handleGenerateSEO = async (options: AIOptions) => {
    if (!scrapedData) return;
    setIsGenerating(true);
    setError(null);
    setImprovedData(null);
    setBonusData(null);

    try {
      const result = await generateSEOWithHuggingFace({
        articleTitle: scrapedData.title,
        articleContent: scrapedData.content,
        category: scrapedData.category,
        tone: options.tone,
        keywords: options.keywords,
        mode: options.mode,
      });

      setImprovedData({
        metaTitle: result.metaTitle,
        metaDesc: result.metaDesc,
        slug: result.slug,
        focusKeyword: result.focusKeyword,
        relatedKeywords: result.relatedKeywords,
        imageAlt: result.imageAlt,
      });

      setBonusData({
        altTitles: result.altTitles,
        altDescriptions: result.altDescriptions,
        socialTwitter: result.socialTwitter,
        socialLinkedIn: result.socialLinkedIn,
        articleTags: result.articleTags,
      });

      showToast('✨ SEO optimized by HuggingFace AI!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'MISSING_API_KEY') {
        setError(
          '🔑 HuggingFace API token is missing. Open src/config.ts and add your free token from huggingface.co/settings/tokens'
        );
      } else if (msg.toLowerCase().includes('still loading')) {
        setError(
          '⏳ Model is warming up. The HuggingFace free tier has a 20-30s cold start. Please wait a moment and try again.'
        );
      } else {
        setError(`Error: ${msg}`);
      }
      showToast('❌ Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySEO = async (finalData: SEOData) => {
    setIsApplying(true);
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: 'APPLY_SEO_METADATA',
            data: {
              metaTitle: finalData.metaTitle,
              metaDesc: finalData.metaDesc,
              slug: finalData.slug,
              focusKeyword: finalData.focusKeyword,
              relatedKeywords: finalData.relatedKeywords,
              imageAlt: finalData.imageAlt,
            },
          },
          (response) => {
            setIsApplying(false);
            if (response?.success) {
              setScrapedData((prev) =>
                prev
                  ? {
                      ...prev,
                      existingMetaTitle: finalData.metaTitle,
                      existingMetaDesc: finalData.metaDesc,
                      existingSlug: finalData.slug,
                      existingFocusKeyword: finalData.focusKeyword,
                      existingRelatedKeywords: finalData.relatedKeywords,
                      existingImageAlt: finalData.imageAlt,
                    }
                  : prev
              );
              showToast('✅ Applied to CMS successfully!');
            } else {
              showToast('⚠️ Could not apply — CMS page may have changed');
            }
          }
        );
      }
    } else {
      // Sandbox simulation
      setTimeout(() => {
        setIsApplying(false);
        setScrapedData((prev) =>
          prev
            ? {
                ...prev,
                existingMetaTitle: finalData.metaTitle,
                existingMetaDesc: finalData.metaDesc,
                existingSlug: finalData.slug,
                existingFocusKeyword: finalData.focusKeyword,
                existingRelatedKeywords: finalData.relatedKeywords,
                existingImageAlt: finalData.imageAlt,
              }
            : prev
        );
        showToast('✅ Applied to CMS (sandbox)!');
      }, 800);
    }
  };

  const handleSelectTitle = (t: string) => {
    setImprovedData((prev) => (prev ? { ...prev, metaTitle: t } : prev));
    showToast('Title applied!');
  };

  const handleSelectDesc = (d: string) => {
    setImprovedData((prev) => (prev ? { ...prev, metaDesc: d } : prev));
    showToast('Description applied!');
  };

  const existingSEO: SEOData = scrapedData
    ? {
        metaTitle: scrapedData.existingMetaTitle,
        metaDesc: scrapedData.existingMetaDesc,
        slug: scrapedData.existingSlug,
        focusKeyword: scrapedData.existingFocusKeyword,
        relatedKeywords: scrapedData.existingRelatedKeywords,
        imageAlt: scrapedData.existingImageAlt,
      }
    : { metaTitle: '', metaDesc: '', slug: '', focusKeyword: '', relatedKeywords: '', imageAlt: '' };

  return (
    <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '580px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          className="animate-float"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'white',
            boxShadow: 'var(--glow-indigo)',
            flexShrink: 0,
          }}
        >
          S
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
            SEO <span className="gradient-text">Assistant</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            Powered by HuggingFace AI
          </div>
        </div>
        <span
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
          }}
        >
          v2.0 HF
        </span>
      </div>

      {/* Status */}
      <StatusIndicator
        isConnected={isConnected}
        articleId={scrapedData?.articleId ?? '—'}
        category={scrapedData?.category ?? '—'}
        onRefresh={syncCMSData}
      />

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.78rem',
            color: '#fca5a5',
            lineHeight: 1.6,
          }}
        >
          {error}
        </div>
      )}

      {/* Connected content */}
      {isConnected && scrapedData && (
        <>
          {/* Article Info */}
          <div
            className="glass-panel"
            style={{ padding: '0.75rem 0.875rem', borderColor: 'rgba(99,102,241,0.2)' }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
              Article
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '0.3rem' }}>
              {scrapedData.title || 'No title'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {scrapedData.content.slice(0, 180)}…
            </div>
          </div>

          {/* AI Panel */}
          <AIPanel
            onGenerate={handleGenerateSEO}
            isGenerating={isGenerating}
            isDisabled={!scrapedData.title}
            isTamilArticle={/[\u0B80-\u0BFF]/.test(scrapedData.title + ' ' + scrapedData.content)}
          />

          {/* Results */}
          {improvedData && (
            <>
              <GooglePreview
                title={improvedData.metaTitle}
                description={improvedData.metaDesc}
                slug={improvedData.slug}
              />
              <SEOComparison
                existing={existingSEO}
                improved={improvedData}
                onApply={handleApplySEO}
                isApplying={isApplying}
                onShowToast={showToast}
              />
            </>
          )}

          {improvedData && bonusData && (
            <BonusPanel
              bonus={bonusData}
              onSelectTitle={handleSelectTitle}
              onSelectDesc={handleSelectDesc}
              onCopyText={async (text) => {
                await navigator.clipboard.writeText(text);
                showToast('Copied!');
              }}
            />
          )}
        </>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '0.875rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(17,24,39,0.95)',
            border: '1px solid var(--primary)',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            boxShadow: 'var(--glow-indigo)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            animation: 'slideUp 0.2s ease forwards',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
