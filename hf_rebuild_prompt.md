# 🔁 Full Rebuild Prompt — AI SEO Assistant (HuggingFace Edition)

> Copy and paste this entire prompt to a fresh AI coding session (new folder, new chat).

---

## THE PROMPT

---

Build me a complete **Chrome Browser Extension** called **"AI SEO Assistant (HuggingFace Edition)"** from scratch inside a new folder called `d:\AI SEO Assistant HF Edition`.

This is a **React + TypeScript + Vite** project that acts as a Chrome extension popup. It connects to a mock CMS page and uses **HuggingFace Inference API** to generate SEO metadata for news articles.

Below is the full specification for every file. Build everything exactly as described.

---

## 1. PROJECT SETUP

### `package.json`
```json
{
  "name": "ai-seo-assistant-hf-edition",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/chrome": "^0.0.268",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.2.2",
    "vite": "^5.3.1"
  }
}
```

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content/content.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content' || chunkInfo.name === 'background') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI SEO Assistant — HF Edition</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/popup/main.tsx"></script>
  </body>
</html>
```

---

## 2. CONFIG FILE

### `src/config.ts`
```typescript
// ============================================================
//  ✅ PLACE YOUR HUGGINGFACE API TOKEN HERE
//  Get a free token from: https://huggingface.co/settings/tokens
//  Choose "Read" access token type.
// ============================================================

export const HF_API_TOKEN: string = 'YOUR_HF_TOKEN_HERE';

// Model to use — Mistral 7B Instruct is free and powerful for SEO tasks
// Other options:
//   'mistralai/Mixtral-8x7B-Instruct-v0.1'  (better, but slower on free tier)
//   'HuggingFaceH4/zephyr-7b-beta'           (great instruction following)
//   'meta-llama/Meta-Llama-3-8B-Instruct'    (requires HF Pro)
export const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
```

---

## 3. AI ENGINE — HuggingFace Inference API

### `src/lib/huggingface.ts`

This is the MOST IMPORTANT file. Replace Groq/Gemini with HuggingFace.

Key differences from the old Groq implementation:
- HuggingFace Inference API endpoint: `https://api-inference.huggingface.co/models/{MODEL_ID}`
- Auth header: `Authorization: Bearer {HF_API_TOKEN}`
- Request body: `{ inputs: promptString, parameters: { max_new_tokens, temperature, return_full_text: false } }`
- Response is `[{ generated_text: "..." }]` — an array, NOT OpenAI-style choices
- HuggingFace models do NOT guarantee JSON output — you MUST use a regex/JSON extraction wrapper
- Model may return the prompt again at the start of generated_text if return_full_text is true (set it false)
- Add retry logic: if the model is loading (503 with `error: "Model ... is currently loading"`), wait and retry up to 3 times
- Wrap the entire JSON in `<SEO_JSON>...</SEO_JSON>` tags in the prompt to make extraction reliable

```typescript
// ============================================================
//  HuggingFace Inference API Service — SEO Optimization
//  Uses HF Inference API with Mistral 7B Instruct (free tier)
// ============================================================

import { HF_API_TOKEN, HF_MODEL } from '../config';

export interface SEOResult {
  metaTitle: string;
  metaDesc: string;
  slug: string;
  focusKeyword: string;
  relatedKeywords: string;
  imageAlt: string;
  altTitles: string[];
  altDescriptions: string[];
  socialTwitter: string;
  socialLinkedIn: string;
  articleTags: string[];
}

interface SEORequestPayload {
  articleTitle: string;
  articleContent: string;
  category: string;
  tone: string;
  keywords: string[];
}

// ---------------------------------------------------------------
//  Build the prompt — wrap JSON in XML tags for reliable parsing
// ---------------------------------------------------------------
function buildPrompt(payload: SEORequestPayload): string {
  const { articleTitle, articleContent, category, tone, keywords } = payload;
  const keywordList = keywords.length > 0 ? keywords.join(', ') : 'not specified';

  return `<s>[INST] You are an expert SEO copywriter. Analyze the article below and generate SEO metadata following the TONE rules strictly.

ARTICLE DETAILS:
- Title: ${articleTitle}
- Category: ${category}
- Content: ${articleContent}
- Focus Keywords: ${keywordList}

SELECTED TONE: "${tone}"

TONE RULES — apply ONLY the selected tone across ALL output fields:

"SEO-Optimized":
  - Pack the primary keyword naturally into the title within the first 4 words
  - Meta description must include keyword + a clear value proposition
  - Use factual, direct language — no fluff, no emotion
  - Slug: ultra-clean, keyword-first

"Professional":
  - Formal, authoritative tone — avoid contractions and casual language
  - Use industry terminology and third-person phrasing where natural
  - Meta title: analytical framing ("An Analysis of..." / "How X Impacts Y")
  - Meta description: data-driven, credibility-forward

"Engaging":
  - Write like you're talking to a curious, smart friend
  - Use "you/your", questions, and relatable hooks
  - Title should spark genuine curiosity without being misleading
  - Description should feel warm, inviting, and conversational

"Clickbait":
  - Make this feel like a viral BuzzFeed/upworthy headline
  - Use power words: Shocking, Exposed, Nobody Told You, Secret, Warning, Mind-Blowing, Finally Revealed
  - Create a curiosity gap — hint at something juicy or surprising without fully revealing it
  - Use numbers where possible: "7 Reasons...", "The #1 Thing...", "3 Secrets..."
  - Add urgency or stakes: "Before It's Too Late", "Right Now", "This Changes Everything"
  - Alt titles must be 3 DIFFERENT clickbait angles: fear-based, curiosity-based, FOMO-based

Your response MUST be ONLY a raw JSON object wrapped in <SEO_JSON> and </SEO_JSON> tags. No other text, no markdown, no explanation.

Example format:
<SEO_JSON>
{"metaTitle":"...","metaDesc":"...","slug":"...","focusKeyword":"...","relatedKeywords":"...","imageAlt":"...","altTitles":["...","...","..."],"altDescriptions":["...","...","..."],"socialTwitter":"...","socialLinkedIn":"...","articleTags":["...","...","...","...","..."]}
</SEO_JSON>

JSON field rules:
- metaTitle: 50-60 chars max, written in the selected tone
- metaDesc: 150-160 chars, in the selected tone, must include the focus keyword
- slug: lowercase-url-slug-with-hyphens
- focusKeyword: primary focus keyword phrase
- relatedKeywords: comma-separated list of 5-7 LSI keywords
- imageAlt: descriptive image alt text for SEO
- altTitles: array of 3 tone-consistent alternative titles
- altDescriptions: array of 3 tone-consistent descriptions
- socialTwitter: tweet in the selected tone, under 280 chars, with hashtags
- socialLinkedIn: LinkedIn post in the selected tone, 2-3 sentences
- articleTags: array of 5 relevant tags

Now generate the SEO metadata for the article: [/INST]`;
}

// ---------------------------------------------------------------
//  Extract JSON from <SEO_JSON>...</SEO_JSON> tags
// ---------------------------------------------------------------
function extractJSON(rawText: string): SEOResult {
  // Try XML tag extraction first
  const tagMatch = rawText.match(/<SEO_JSON>([\s\S]*?)<\/SEO_JSON>/);
  if (tagMatch) {
    try {
      return JSON.parse(tagMatch[1].trim());
    } catch {
      // Fall through to brute-force extraction
    }
  }

  // Fallback: find first { ... } block
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(`Failed to parse JSON from response: ${rawText.slice(0, 300)}`);
    }
  }

  throw new Error(`No JSON found in model response: ${rawText.slice(0, 300)}`);
}

// ---------------------------------------------------------------
//  Main HuggingFace API call with retry for model loading
// ---------------------------------------------------------------
export async function generateSEOWithHuggingFace(
  payload: SEORequestPayload
): Promise<SEOResult> {
  if (!HF_API_TOKEN || HF_API_TOKEN === 'YOUR_HF_TOKEN_HERE') {
    throw new Error('MISSING_API_KEY');
  }

  const endpoint = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  const body = {
    inputs: buildPrompt(payload),
    parameters: {
      max_new_tokens: 1024,
      temperature: 0.7,
      return_full_text: false,
      do_sample: true,
    },
  };

  const MAX_RETRIES = 3;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 503) {
      // Model is loading — wait and retry
      const errData = await response.json().catch(() => ({}));
      const waitTime = (errData.estimated_time ?? 20) * 1000;
      console.warn(`HuggingFace model loading. Waiting ${waitTime / 1000}s before retry ${attempt}/${MAX_RETRIES}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, Math.min(waitTime, 30000)));
        continue;
      }
      throw new Error(`HuggingFace model is still loading after ${MAX_RETRIES} attempts. Please try again in a minute.`);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // HF response is an array: [{ generated_text: "..." }]
    const rawText: string = Array.isArray(data)
      ? (data[0]?.generated_text ?? '')
      : (data?.generated_text ?? '');

    if (!rawText) {
      throw new Error('HuggingFace returned an empty response');
    }

    try {
      return extractJSON(rawText);
    } catch (parseErr) {
      lastError = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
      if (attempt < MAX_RETRIES) {
        console.warn(`JSON parse failed on attempt ${attempt}, retrying...`);
        continue;
      }
    }
  }

  throw lastError;
}
```

---

## 4. MANIFEST

### `public/manifest.json`
```json
{
  "manifest_version": 3,
  "name": "AI SEO Assistant — HF Edition",
  "version": "2.0.0",
  "description": "Generate optimized SEO metadata for news articles using HuggingFace open-source AI models.",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "index.html",
    "default_title": "AI SEO Assistant — HF Edition"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["http://localhost/*", "http://127.0.0.1/*", "file://*/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

---

## 5. BACKGROUND SCRIPT

### `src/background/background.ts`
```typescript
// Background Service Worker for AI SEO Assistant — HF Edition

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI SEO Assistant HF Edition installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PING_BACKGROUND') {
    sendResponse({ status: 'OK', senderId: sender.id });
  }
  return true;
});
```

---

## 6. CONTENT SCRIPT

### `src/content/content.ts`

This script runs on the CMS page. It reads CMS fields and applies metadata back to the DOM. It also watches for article switches.

```typescript
// Content Script for AI SEO Assistant — HF Edition

function isCMSPage(): boolean {
  return document.getElementById('cms-article-id') !== null;
}

function getArticleDetails() {
  if (!isCMSPage()) {
    return { error: 'Not on an article page or unsupported CMS' };
  }

  const idEl = document.getElementById('cms-article-id') as HTMLInputElement | null;
  const titleEl = document.getElementById('cms-article-title') as HTMLInputElement | null;
  const contentEl = document.getElementById('cms-article-content') as HTMLTextAreaElement | null;
  const categoryEl = document.getElementById('cms-article-category') as HTMLSelectElement | null;
  const metaTitleEl = document.getElementById('cms-meta-title') as HTMLInputElement | null;
  const metaDescEl = document.getElementById('cms-meta-description') as HTMLTextAreaElement | null;
  const slugEl = document.getElementById('cms-seo-slug') as HTMLInputElement | null;
  const focusKwEl = document.getElementById('cms-focus-keyword') as HTMLInputElement | null;
  const relatedKwsEl = document.getElementById('cms-related-keywords') as HTMLInputElement | null;
  const imageAltEl = document.getElementById('cms-image-alt') as HTMLInputElement | null;

  return {
    articleId: idEl?.value || 'N/A',
    title: titleEl?.value || '',
    content: contentEl?.value || '',
    category: categoryEl?.value || 'General News',
    existingMetaTitle: metaTitleEl?.value || '',
    existingMetaDesc: metaDescEl?.value || '',
    existingSlug: slugEl?.value || '',
    existingFocusKeyword: focusKwEl?.value || '',
    existingRelatedKeywords: relatedKwsEl?.value || '',
    existingImageAlt: imageAltEl?.value || '',
  };
}

function applySEOMetadata(
  metaTitle: string,
  metaDesc: string,
  slug: string,
  focusKeyword: string,
  relatedKeywords: string,
  imageAlt: string
): boolean {
  if (!isCMSPage()) return false;

  const metaTitleEl = document.getElementById('cms-meta-title') as HTMLInputElement | null;
  const metaDescEl = document.getElementById('cms-meta-description') as HTMLTextAreaElement | null;
  const slugEl = document.getElementById('cms-seo-slug') as HTMLInputElement | null;
  const focusKwEl = document.getElementById('cms-focus-keyword') as HTMLInputElement | null;
  const relatedKwsEl = document.getElementById('cms-related-keywords') as HTMLInputElement | null;
  const imageAltEl = document.getElementById('cms-image-alt') as HTMLInputElement | null;

  let updated = false;

  const setValue = (el: HTMLInputElement | HTMLTextAreaElement | null, val: string) => {
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      updated = true;
    }
  };

  setValue(metaTitleEl, metaTitle);
  setValue(metaDescEl, metaDesc);
  setValue(slugEl, slug);
  setValue(focusKwEl, focusKeyword);
  setValue(relatedKwsEl, relatedKeywords);
  setValue(imageAltEl, imageAlt);

  if (updated) {
    window.postMessage({ type: 'SEO_ASSISTANT_APPLIED' }, '*');
  }

  return updated;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'GET_ARTICLE_DETAILS') {
    const details = getArticleDetails();
    sendResponse(details);
  } else if (message.action === 'APPLY_SEO_METADATA') {
    const { metaTitle, metaDesc, slug, focusKeyword, relatedKeywords, imageAlt } = message.data;
    const success = applySEOMetadata(metaTitle, metaDesc, slug, focusKeyword, relatedKeywords, imageAlt);
    sendResponse({ success });
  }
  return true;
});

function watchForArticleSwitch() {
  const articleIdEl = document.getElementById('cms-article-id');
  if (!articleIdEl) return;

  articleIdEl.addEventListener('change', () => {
    setTimeout(() => {
      const details = getArticleDetails();
      try {
        chrome.runtime.sendMessage({ action: 'ARTICLE_CHANGED', data: details });
      } catch {
        // Popup may be closed — ignore
      }
    }, 50);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watchForArticleSwitch);
} else {
  watchForArticleSwitch();
}
```

---

## 7. POPUP ENTRY POINTS

### `src/popup/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/popup/index.css`

Use this EXACT CSS design system (dark glassmorphism theme with indigo/magenta/emerald palette):

```css
/* Design System for AI SEO Assistant — HF Edition */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

:root {
  --bg-primary: #0b0f19;
  --bg-secondary: rgba(17, 24, 39, 0.7);
  --bg-card: rgba(30, 41, 59, 0.4);
  --bg-hover: rgba(255, 255, 255, 0.05);
  
  --primary: #6366f1;
  --primary-rgb: 99, 102, 241;
  --primary-glow: rgba(99, 102, 241, 0.25);
  --secondary: #d946ef;
  --secondary-rgb: 217, 70, 239;
  
  --accent: #10b981;
  --accent-rgb: 16, 185, 129;
  --warning: #f59e0b;
  --danger: #ef4444;
  
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  --border: rgba(255, 255, 255, 0.06);
  --border-focus: rgba(99, 102, 241, 0.4);
  --border-hover: rgba(255, 255, 255, 0.12);
  
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  --glow-indigo: 0 0 15px rgba(99, 102, 241, 0.4);
  --glow-emerald: 0 0 15px rgba(16, 185, 129, 0.4);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  width: 460px;
  height: 580px;
  overflow-x: hidden;
  overflow-y: auto;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

.glass-panel {
  background: var(--bg-secondary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-lg);
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes spin { to { transform: rotate(360deg); } }

.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-float { animation: float 3s ease-in-out infinite; }
.spinner { animation: spin 1s linear infinite; }

.gradient-text {
  background: linear-gradient(135deg, #a5b4fc, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.shiny-button {
  background: linear-gradient(90deg, #6366f1 0%, #d946ef 50%, #6366f1 100%);
  background-size: 200% auto;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.shiny-button:hover {
  background-position: right center;
  box-shadow: 0 4px 20px rgba(217, 70, 239, 0.4);
  transform: translateY(-1px);
}

.shiny-button:active { transform: translateY(1px); }

input, textarea, select {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 0.375rem;
  padding: 0.625rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

input:focus, textarea:focus, select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--bg-hover);
  border: 1px solid var(--border);
}

.compare-box {
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.3);
  border-radius: 0.5rem;
  padding: 0.875rem;
}

.compare-box.improved {
  border-left: 3px solid var(--accent);
  background: rgba(16, 185, 129, 0.02);
}

.metric-bar {
  height: 4px;
  background-color: var(--border-hover);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.metric-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
}
```

---

## 8. COMPONENTS

### `src/components/StatusIndicator.tsx`

A component showing whether the popup is connected to the CMS. Props: `isConnected: boolean`, `articleId: string`, `category: string`, `onRefresh: () => void`.

- Shows a pulsing green dot when connected, amber when not
- When connected: shows "Editorial CMS Synced" with article ID and category badge
- When disconnected: shows "Awaiting CMS Page Connection" with a link to mock-cms.html
- Has a "Sync" button with refresh icon that calls onRefresh
- Uses the `.glass-panel` class with conditional green/amber border colors
- Uses `.animate-pulse` on the outer dot ring

### `src/components/AIPanel.tsx`

Exports `AIOptions { tone: string; keywords: string[] }`.
Props: `onGenerate: (options: AIOptions) => void`, `isGenerating: boolean`, `isDisabled: boolean`.

- Shows 4 tone buttons: `SEO-Optimized`, `Professional`, `Engaging`, `Clickbait`
  - Active tone gets `var(--primary)` background and border
- Keyword tag input: type a keyword and press Enter or comma to add it as a tag-badge
  - Tags are removable with an × button
  - Default keywords: `['SEO', 'Trending']`
- Big "Optimize Article with AI" button using `.shiny-button` class
  - Shows spinner + "AI Engine Thinking..." when generating
  - The button text should say "HuggingFace AI" somewhere to distinguish it
- Shows a small notice under the button: "⚡ Powered by HuggingFace Open Models — First request may take 20-30s while model loads"
  - Style this notice in amber/warning color

### `src/components/GooglePreview.tsx`

Props: `title: string`, `description: string`, `slug: string`.

Renders a realistic dark-themed Google search result card:
- Breadcrumb row: mock favicon "GN" circle, "Global Newsroom", URL with slug in blue
- Title: large blue link text (19px), hover underline
- Description: gray snippet text (14px)
- Wrap in `.glass-panel` with a heading "Google Search Engine Preview"

### `src/components/SEOComparison.tsx`

Exports `SEOData { metaTitle, metaDesc, slug, focusKeyword, relatedKeywords, imageAlt }`.
Props: `existing: SEOData`, `improved: SEOData`, `onApply: (data: SEOData) => void`, `isApplying: boolean`, `onShowToast: (msg: string) => void`.

Features:
- **SEO Score Widget**: Shows existing vs optimized score side by side with arrow and improvement delta
  - Score algorithm: base 20pts + title length pts (20 if 50-60 chars) + desc length pts (20 if 150-160) + slug validity (15) + focus keyword in title/desc (5+5+5) + related keywords count (2pts each, max 10) + image alt length (10 if 30-125 chars) — capped at 100
- **6 editable fields**: Meta Title, Meta Description, Slug, Focus Keyword, Related Keywords, Image Alt
  - Each has: field label + validation status badge (green ✓ or amber ⚠), char count, ✏️ Edit + 📋 Copy buttons
  - Edit mode turns the field into an input/textarea; blur saves it
  - Related keywords display as tag badges when not editing
  - Duplicate title detection: if AI title matches existing exactly, show amber warning
- **Action buttons**: "📋 Copy All" (copies formatted block to clipboard) + "Apply to CMS" (calls onApply with edited data)
  - Apply button is emerald green with glow shadow

### `src/components/BonusPanel.tsx`

Exports `BonusData { altTitles: string[], altDescriptions: string[], socialTwitter: string, socialLinkedIn: string, articleTags: string[] }`.
Props: `bonus: BonusData`, `onSelectTitle: (t: string) => void`, `onSelectDesc: (d: string) => void`, `onCopyText: (text: string) => void`.

- Has 2 tabs: "AI Alternatives" and "Social Posts"
- **AI Alternatives tab**: Lists 3 alt titles (with "Use" + copy buttons) and 3 alt descriptions (with "Use" + copy buttons)
- **Social Posts tab**: Shows Twitter/X caption and LinkedIn caption, each with a "Copy Post" link button; and a row of clickable article tag badges

---

## 9. MAIN APP

### `src/popup/App.tsx`

Interfaces:
```typescript
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
}
```

State: `isConnected`, `isGenerating`, `isApplying`, `scrapedData`, `improvedData`, `bonusData`, `error`, `toastMessage`.

**syncCMSData()**: 
- If `chrome.tabs` exists: sends `GET_ARTICLE_DETAILS` to active tab content script. On success sets `isConnected=true` and `scrapedData`. On failure/error sets `isConnected=false`.
- If `chrome.tabs` doesn't exist (sandbox mode): sets mock article data directly (The Rise of Generative AI in Local Journalism).

**useEffect on mount**: Calls `syncCMSData()`. Also listens for `ARTICLE_CHANGED` messages from chrome.runtime and updates `scrapedData`.

**handleGenerateSEO(options)**:
- Sets `isGenerating=true`
- Calls `generateSEOWithHuggingFace(...)` from `src/lib/huggingface.ts`
- On success: sets `improvedData` and `bonusData`
- On `MISSING_API_KEY` error: shows special message pointing to `src/config.ts` and `https://huggingface.co/settings/tokens`
- On `model is still loading` error: shows amber-colored retry suggestion
- Shows toast on success/failure

**handleApplySEO(finalData)**: Sends `APPLY_SEO_METADATA` to active tab. Updates `scrapedData` local state to reflect applied values. In sandbox: simulates with setTimeout.

**Layout**:
- Header: "S" icon with indigo-magenta gradient, title "SEO **Assistant**" (gradient text), subtitle "Powered by HuggingFace AI", version badge "v2.0 HF"
- StatusIndicator
- Error panel (red glass) if not connected
- If connected: Article info preview (title + content preview), AIPanel, GooglePreview (if improvedData), SEOComparison (if improvedData), BonusPanel (if both improvedData and bonusData)
- Toast notification (floating bottom bar with primary border + checkmark)

---

## 10. MOCK CMS PAGE

### `public/mock-cms.html`

Build a realistic-looking editorial CMS article editor page with light theme (white background, indigo accents). This page is what the Chrome extension connects to and reads/writes SEO fields.

Required DOM element IDs (content script reads/writes these):
- `cms-article-id` — hidden input, article ID
- `cms-article-title` — text input, article title
- `cms-article-content` — textarea, article body
- `cms-article-category` — select dropdown with options: Technology, Business, Politics, Health, Sports, Entertainment, Science, General News
- `cms-meta-title` — text input, SEO meta title
- `cms-meta-description` — textarea, SEO meta description
- `cms-seo-slug` — text input, URL slug
- `cms-focus-keyword` — text input, focus keyword
- `cms-related-keywords` — text input, comma-separated related keywords
- `cms-image-alt` — text input, image alt text

Features of the mock CMS:
- Header with "Global Newsroom CMS" brand and admin user badge
- Article selector dropdown to switch between 3 pre-loaded articles
  - When switching, trigger a `change` event on `cms-article-id` so the extension detects the switch
  - Pre-load 3 articles: (1) AI in Local Journalism, (2) Climate Policy Summit, (3) Space Economy Article
- Left column: Article Details form (title, category, content textarea)
- Right column: SEO Metadata form (meta title with char counter, meta description with char counter, slug, focus keyword, related keywords, image alt)
- A visual SEO score bar at the top of the right column
- A toast notification when the extension applies changes (listen for `window.postMessage` with type `SEO_ASSISTANT_APPLIED`)
- A "Save Draft" button (visual only)
- Character counters on meta title (60 char limit shown) and meta description (160 char limit shown) — highlight red if over limit

---

## 11. BUILD AND RUN INSTRUCTIONS

After generating all files:

1. `npm install`
2. `npm run dev` — for sandbox testing in browser
3. `npm run build` — to build the Chrome extension
4. Load `dist/` folder in Chrome → Extensions → Developer Mode → Load Unpacked
5. Open `public/mock-cms.html` (or the built `dist/mock-cms.html`) in a Chrome tab
6. Click the extension icon → popup connects to the CMS page
7. Add your HuggingFace token to `src/config.ts`

> **⚠️ IMPORTANT HuggingFace note for the developer**: The free HuggingFace Inference API has a cold-start delay of 20-30 seconds when the model hasn't been used recently. This is normal. The retry logic handles 503 "model loading" responses automatically. If you want zero cold-starts, upgrade to HuggingFace Pro or use a Dedicated Endpoint.

---

## WHAT'S DIFFERENT FROM THE ORIGINAL (Groq version)

| Aspect | Original (Groq) | This Version (HuggingFace) |
|---|---|---|
| API | Groq Cloud | HuggingFace Inference API |
| Model | Llama 3.3 70B | Mistral 7B Instruct v0.3 |
| Auth | `GROQ_API_KEY` | `HF_API_TOKEN` |
| Response format | OpenAI-style `choices[0].message.content` | Array `[{ generated_text }]` |
| JSON guarantee | Yes (json_object mode) | No — must extract with regex |
| Cold start | None | 20-30s first request |
| Retry logic | Not needed | 503 retry up to 3x |
| Prompt format | Plain text | Mistral `<s>[INST]...[/INST]` format |
| Cost | Free tier, fast | Free tier, slower |

---

*End of prompt. Build the entire project from these specifications.*
