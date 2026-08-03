// ============================================================
//  HuggingFace Inference API Service — SEO Optimization
//  Uses HF Serverless Router (OpenAI-compatible chat completions)
//  Supports English SEO Optimization
// ============================================================

import { HF_API_TOKEN, HF_MODEL_ENGLISH, HF_MODEL_TAMIL } from '../config';

// HuggingFace Serverless Inference — OpenAI-compatible chat completions router
const HF_ROUTER_BASE = 'https://router.huggingface.co/v1';

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

export interface SEORequestPayload {
  articleTitle: string;
  articleContent: string;
  category: string;
  tone: string;
  keywords: string[];
  mode?: 'english' | 'tamil';
}

// ---------------------------------------------------------------
//  Build messages for OpenAI-compatible chat completions
// ---------------------------------------------------------------
function buildMessages(payload: SEORequestPayload): { role: string; content: string }[] {
  const { articleTitle, articleContent, category, tone, keywords, mode = 'english' } = payload;
  const keywordList = keywords.length > 0 ? keywords.join(', ') : 'not specified';
  const isTamilMode = mode === 'tamil';

  const systemPrompt = isTamilMode
    ? 'You are an expert Tamil SEO copywriter fluent in Tamil (தமிழ்) and English. When given an article (in English or Tamil), respond ONLY with a raw JSON object wrapped in <SEO_JSON> and </SEO_JSON> tags. Write all metadata text fields in authentic TAMIL script (தமிழ்), except the "slug" field which MUST be written in clean lowercase English/Latin characters with hyphens.'
    : 'You are an expert SEO copywriter. When given an article, respond ONLY with a raw JSON object wrapped in <SEO_JSON> and </SEO_JSON> tags. No other text, no markdown, no explanation.';

  const toneRules = isTamilMode
    ? `
"SEO-Optimized":
  - Pack the primary keyword naturally into the title in Tamil script (தமிழ்)
  - Meta description must include keyword + clear value proposition in Tamil
  - Use factual, direct Tamil phrasing
  - Slug: ultra-clean lowercase English/Latin characters with hyphens

"Professional":
  - Formal, authoritative Tamil tone (தமிழ்)
  - Use clear terminology and third-person phrasing
  - Meta title: analytical framing in Tamil

"Engaging":
  - Warm, engaging Tamil conversational tone (தமிழ்)
  - Use relatable hooks in Tamil

"Clickbait":
  - High-impact viral hooks in Tamil (e.g. தமிழ்: அதிர்ச்சி, ரகசியம், தெரியுமா, எச்சரிக்கை, இதோ!)
  - Alt titles must be 3 DIFFERENT clickbait angles in Tamil`
    : `
"SEO-Optimized":
  - Pack the primary keyword naturally into the title within the first 4 words
  - Meta description must include keyword + a clear value proposition
  - Use factual, direct language, no fluff
  - Slug: ultra-clean, keyword-first

"Professional":
  - Formal, authoritative tone
  - Use industry terminology and third-person phrasing
  - Meta title: analytical framing
  - Meta description: data-driven, credibility-forward

"Engaging":
  - Write like talking to a curious, smart reader
  - Use engaging, warm language and relatable hooks
  - Title should spark genuine curiosity
  - Description should feel inviting and conversational

"Clickbait":
  - Make this feel like a viral headline
  - Use high-impact power words (e.g. Unbelievable, Shocking, Secret, Warning, Revealed!)
  - Create a curiosity gap
  - Use numbers where possible
  - Alt titles must be 3 DIFFERENT clickbait angles`;

  const exampleFormat = '{"metaTitle":"...","metaDesc":"...","slug":"...","focusKeyword":"...","relatedKeywords":"...","imageAlt":"...","altTitles":["...","...","..."],"altDescriptions":["...","...","..."],"socialTwitter":"...","socialLinkedIn":"...","articleTags":["...","...","...","...","..."]}';

  const userPrompt = [
    isTamilMode
      ? 'Analyze the article below and generate TAMIL (தமிழ்) SEO metadata following the TONE rules strictly.'
      : 'Analyze the article below and generate English SEO metadata following the TONE rules strictly.',
    '',
    'ARTICLE DETAILS:',
    '- Title: ' + articleTitle,
    '- Category: ' + category,
    '- Content: ' + articleContent,
    '- Focus Keywords: ' + keywordList,
    '',
    'SELECTED TONE: "' + tone + '"',
    '',
    'TONE RULES - apply ONLY the selected tone across ALL output fields:',
    toneRules,
    '',
    'IMPORTANT METADATA & SLUG RULES:',
    isTamilMode
      ? '1. All output fields (metaTitle, metaDesc, focusKeyword, relatedKeywords, imageAlt, altTitles, altDescriptions, socialTwitter, socialLinkedIn, articleTags) MUST be written in authentic, fluent TAMIL script (தமிழ்).\n2. The "slug" field MUST use clean lowercase English/Latin characters with hyphens (e.g. "tamil-news-ai-journalism"), suitable for standard web URLs.'
      : '1. All output text fields MUST be written in clear, high-quality, fluent English.\n2. The "slug" field MUST use clean lowercase English/Latin characters with hyphens (e.g. "ai-journalism-news-trends"), suitable for standard web URLs.',
    '',
    'Respond ONLY with a raw JSON object wrapped in <SEO_JSON> and </SEO_JSON> tags. No other text.',
    '',
    'Example format:',
    '<SEO_JSON>',
    exampleFormat,
    '</SEO_JSON>',
    '',
    'JSON field rules:',
    isTamilMode
      ? '- metaTitle: MUST BE BETWEEN 50 AND 60 CHARACTERS MAX in Tamil script (தமிழ்)\n- metaDesc: MUST BE BETWEEN 150 AND 160 CHARACTERS MAX in Tamil script (தமிழ்). NEVER EXCEED 160 CHARACTERS.\n- slug: lowercase-latin-url-slug-with-hyphens\n- focusKeyword: primary focus keyword in Tamil\n- relatedKeywords: 5-7 LSI keywords in Tamil\n- imageAlt: descriptive image alt text in Tamil (30-125 chars)\n- altTitles: array of 3 tone-consistent alternative titles in Tamil (50-60 chars)\n- altDescriptions: array of 3 tone-consistent descriptions in Tamil (150-160 chars max)\n- socialTwitter: tweet in Tamil under 280 chars\n- socialLinkedIn: LinkedIn post in Tamil, 2-3 sentences\n- articleTags: array of 5 relevant tags in Tamil'
      : '- metaTitle: MUST BE BETWEEN 50 AND 60 CHARACTERS MAX\n- metaDesc: MUST BE BETWEEN 150 AND 160 CHARACTERS MAX. NEVER EXCEED 160 CHARACTERS.\n- slug: lowercase-latin-url-slug-with-hyphens\n- focusKeyword: primary focus keyword phrase in English\n- relatedKeywords: comma-separated list of 5-7 LSI keywords in English\n- imageAlt: descriptive image alt text in English (30-125 chars)\n- altTitles: array of 3 tone-consistent alternative titles in English (50-60 chars)\n- altDescriptions: array of 3 tone-consistent descriptions in English (150-160 chars max)\n- socialTwitter: tweet in English, under 280 chars, with hashtags\n- socialLinkedIn: LinkedIn post in English, 2-3 sentences\n- articleTags: array of 5 relevant tags in English',
    '',
    'Now generate the SEO metadata for the article:',
  ].join('\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

// ---------------------------------------------------------------
//  Helper to trim text cleanly to max characters without breaking
// ---------------------------------------------------------------
function clampText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const sliced = text.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxLen * 0.75)) {
    return sliced.slice(0, lastSpace).trim();
  }
  return sliced.trim();
}

// ---------------------------------------------------------------
//  Normalize JSON result to ensure safe fields & flexible key mapping
// ---------------------------------------------------------------
function normalizeSEOResult(rawObj: any): SEOResult {
  if (!rawObj || typeof rawObj !== 'object') {
    throw new Error('Invalid JSON structure returned by model');
  }

  const getStr = (keys: string[]): string => {
    for (const k of keys) {
      if (typeof rawObj[k] === 'string' && rawObj[k].trim()) return rawObj[k].trim();
    }
    return '';
  };

  const getArr = (keys: string[]): string[] => {
    for (const k of keys) {
      if (Array.isArray(rawObj[k])) return rawObj[k].map(String).filter(Boolean);
      if (typeof rawObj[k] === 'string' && rawObj[k].trim()) return rawObj[k].split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const metaTitle = clampText(getStr(['metaTitle', 'meta_title', 'title', 'SEO_Title']), 60);
  const rawMetaDesc = getStr(['metaDesc', 'meta_description', 'description', 'SEO_Description']);
  const metaDesc = clampText(rawMetaDesc, 160);

  let slug = getStr(['slug', 'url_slug', 'permalink']);
  if (slug) {
    slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  const focusKeyword = getStr(['focusKeyword', 'focus_keyword', 'keyword']);
  
  let relatedKeywords = getStr(['relatedKeywords', 'related_keywords']);
  if (!relatedKeywords) {
    const kwArr = getArr(['keywords', 'lsi_keywords']);
    relatedKeywords = kwArr.join(', ');
  }

  const imageAlt = clampText(getStr(['imageAlt', 'image_alt', 'alt_text', 'alt']), 125);
  const altTitles = getArr(['altTitles', 'alt_titles', 'alternative_titles']).map((t) => clampText(t, 60));
  const altDescriptions = getArr(['altDescriptions', 'alt_descriptions', 'alternative_descriptions']).map((d) => clampText(d, 160));
  const socialTwitter = getStr(['socialTwitter', 'social_twitter', 'twitter']);
  const socialLinkedIn = getStr(['socialLinkedIn', 'social_linkedin', 'linkedin']);
  const articleTags = getArr(['articleTags', 'article_tags', 'tags']);

  return {
    metaTitle: metaTitle || 'SEO Optimized Title',
    metaDesc: metaDesc || 'SEO optimized meta description for article.',
    slug: slug || 'seo-article-slug',
    focusKeyword: focusKeyword || (relatedKeywords ? relatedKeywords.split(',')[0] : 'SEO'),
    relatedKeywords: relatedKeywords || 'SEO, content, news',
    imageAlt: imageAlt || 'Article featured banner image',
    altTitles: altTitles.length > 0 ? altTitles : [metaTitle || 'Alternative Title 1', 'Alternative Title 2', 'Alternative Title 3'],
    altDescriptions: altDescriptions.length > 0 ? altDescriptions : [metaDesc || 'Alternative description 1', 'Alternative description 2', 'Alternative description 3'],
    socialTwitter: socialTwitter || (metaTitle ? `${metaTitle} #SEO #Trending` : 'Check out this article! #SEO'),
    socialLinkedIn: socialLinkedIn || (metaTitle ? `${metaTitle}. Read full analysis on our site.` : 'Read full analysis on our website.'),
    articleTags: articleTags.length > 0 ? articleTags : ['SEO', 'Article', 'News', 'Trending', 'AI'],
  };
}

// ---------------------------------------------------------------
//  Attempt to repair and parse truncated JSON strings safely
// ---------------------------------------------------------------
function repairAndParseJSON(jsonStr: string): any {
  let str = jsonStr.trim();
  try {
    return JSON.parse(str);
  } catch {
    // Continue to repair
  }

  // 1. Close unclosed quote if odd number of unescaped quotes
  const quoteMatches = str.match(/(?<!\\)"/g) || [];
  if (quoteMatches.length % 2 !== 0) {
    str += '"';
  }

  // 2. Remove trailing structural artifacts
  str = str.replace(/,\s*$/, '');
  str = str.replace(/,\s*"[^"]*":?\s*$/, '');

  // 3. Close open brackets and braces
  const openBrackets = (str.match(/\[/g) || []).length - (str.match(/\]/g) || []).length;
  const openBraces = (str.match(/\{/g) || []).length - (str.match(/\}/g) || []).length;

  for (let i = 0; i < openBrackets; i++) str += ']';
  for (let i = 0; i < openBraces; i++) str += '}';

  return JSON.parse(str);
}

// ---------------------------------------------------------------
//  Extract JSON from <SEO_JSON>...</SEO_JSON> tags
// ---------------------------------------------------------------
function extractJSON(rawText: string): SEOResult {
  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '');

  const tagMatch = cleaned.match(/<SEO_JSON>([\s\S]*?)(?:<\/SEO_JSON>|$)/);
  if (tagMatch) {
    try {
      const parsed = repairAndParseJSON(tagMatch[1].trim());
      return normalizeSEOResult(parsed);
    } catch {
      // Fall through
    }
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*/);
  if (jsonMatch) {
    try {
      const parsed = repairAndParseJSON(jsonMatch[0].trim());
      return normalizeSEOResult(parsed);
    } catch {
      throw new Error('Failed to parse JSON from response: ' + rawText.slice(0, 300));
    }
  }

  throw new Error('No JSON found in model response: ' + rawText.slice(0, 300));
}

// ---------------------------------------------------------------
//  Main HuggingFace API call — OpenAI-compatible chat completions
// ---------------------------------------------------------------
export async function generateSEOWithHuggingFace(
  payload: SEORequestPayload
): Promise<SEOResult> {
  if (!HF_API_TOKEN || HF_API_TOKEN === 'YOUR_HF_TOKEN_HERE') {
    throw new Error('MISSING_API_KEY');
  }

  const endpoint = HF_ROUTER_BASE + '/chat/completions';
  const targetModel = payload.mode === 'tamil' ? HF_MODEL_TAMIL : HF_MODEL_ENGLISH;

  const body = {
    model: targetModel,
    messages: buildMessages(payload),
    max_tokens: 2048,
    temperature: 0.7,
    stream: false,
  };

  const MAX_RETRIES = 2;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35_000);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + HF_API_TOKEN,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      lastError = new Error(
        isTimeout
          ? 'HuggingFace request timed out after 35s. Please click Optimize again.'
          : 'Network error — could not reach HuggingFace API. Check connection. (' + String(fetchErr) + ')'
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw lastError;
    }
    clearTimeout(timeoutId);

    if (response.status === 503 || response.status === 429) {
      const errData = await response.json().catch(() => ({})) as { estimated_time?: number };
      const waitTime = Math.min((errData.estimated_time ?? 15) * 1000, 20000);
      console.warn('HuggingFace ' + response.status + '. Waiting ' + (waitTime / 1000) + 's (attempt ' + attempt + '/' + MAX_RETRIES + ')');
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }
      throw new Error('HuggingFace model is warming up. Please wait 15-20 seconds and click Optimize again.');
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('HuggingFace API error ' + response.status + ': ' + errText);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawText = data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      throw new Error('HuggingFace returned an empty response');
    }

    try {
      return extractJSON(rawText);
    } catch (parseErr) {
      lastError = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
      if (attempt < MAX_RETRIES) {
        console.warn('JSON parse failed on attempt ' + attempt + ', retrying...');
        continue;
      }
    }
  }

  throw lastError;
}
