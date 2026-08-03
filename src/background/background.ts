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
