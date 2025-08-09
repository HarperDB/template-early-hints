export function toRelativeIfSameOrigin(assetUrl: string, pageUrl: string) {
  if (/^:\/\//.test(assetUrl) || /^[^/]+$/.test(assetUrl)) return assetUrl;
  try {
    const asset = new URL(assetUrl, pageUrl);
    const page = new URL(pageUrl);
    if (asset.origin === page.origin) {
      return asset.pathname + asset.search;
    }
    return assetUrl;
  } catch {
    return assetUrl;
  }
}

export function guessAsType(url: string): string {
	const path = new URL(url, 'http://dummy').pathname.toLowerCase();

	const extMap: Record<string, string> = {
		'.avif': 'image',
		'.jpg': 'image',
		'.jpeg': 'image',
		'.png': 'image',
		'.gif': 'image',
		'.webp': 'image',
		'.css': 'style',
		'.js': 'script',
		'.woff': 'font',
		'.woff2': 'font',
		'.ttf': 'font',
		'.otf': 'font',
	};

	const ext = path.slice(path.lastIndexOf('.'));
	return extMap[ext] || 'fetch';
}

export function getCrossoriginAttr(assetUrl: string, pageUrl: string, asType: string): string {
  try {
    const asset = new URL(assetUrl, pageUrl);
    const page = new URL(pageUrl);
    const isCrossOrigin = asset.origin !== page.origin;
    if (isCrossOrigin && (asType === 'image' || asType === 'font')) {
      return 'crossorigin="anonymous"';
    }
    return '';
  } catch {
    return '';
  }
}