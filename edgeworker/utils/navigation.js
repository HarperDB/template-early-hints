// Emit Early Hints only for main page navigations.
// Prefer Sec-Fetch-* when present; fall back to "Accept: text/html" for Safari/older browsers.
export function isMainDocumentNavigation(req) {
  const header = (name) => (req.getHeader(name) || [])[0]?.toLowerCase() || '';
  const mode   = header('sec-fetch-mode');   // "navigate" on real navs (Chromium/Firefox)
  const dest   = header('sec-fetch-dest');   // "document" on main doc
  const user   = header('sec-fetch-user');   // "?1" when user-initiated; may be absent
  const accept = header('accept');           // Fallback signal for HTML
  const method = (req.method || '').toString().toUpperCase();

  const hasFetchMetadata = mode || dest || user;

  if (hasFetchMetadata) {
    return mode === 'navigate' && dest === 'document' && (user === '' || user === '?1');
  }

  const looksLikeHtmlNav = accept.includes('text/html') && method !== 'OPTIONS';
  return looksLikeHtmlNav;
}