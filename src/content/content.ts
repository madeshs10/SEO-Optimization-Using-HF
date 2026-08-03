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
