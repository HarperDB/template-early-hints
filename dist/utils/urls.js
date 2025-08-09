export function toRelativeIfSameOrigin(assetUrl, pageUrl) {
    try {
        const asset = new URL(assetUrl, pageUrl);
        const page = new URL(pageUrl);
        if (asset.origin === page.origin) {
            return asset.pathname + asset.search;
        }
        return assetUrl;
    }
    catch {
        return assetUrl;
    }
}
export function guessAsType(url) {
    const path = new URL(url, 'http://dummy').pathname.toLowerCase();
    const extMap = {
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
