import { Resource, databases, logger } from 'harperdb';
import type { User } from '../types/index.js';

const {
	ProductImages: ProductImagesTable,
} = databases.EarlyHints;

const toRelativeIfSameOrigin = (imageUrl: string, pageUrl: string): string => {
  try {
    const imgUrl = new URL(imageUrl, pageUrl);
    const pageOrigin = new URL(pageUrl).origin;
    if (imgUrl.origin !== pageOrigin) return imageUrl;
    return `${imgUrl.pathname}${imgUrl.search}${imgUrl.hash}`;
  } catch {
    return imageUrl;
  }
};

function isCrossOrigin(imageUrl: string, pageUrl: string): boolean {
  if (!/^https?:\/\//.test(imageUrl)) return false;
  const imgUrl = new URL(imageUrl);
  const pageOrigin = new URL(pageUrl).origin;
  return imgUrl.origin !== pageOrigin;
}

const getProductImages = async (url: string, safari = false) => {
	logger.info(`Fetching product images for URL: ${url}`);

	const result = await ProductImagesTable.get(url);

	if (!result?.hints) {
		return [];
	}

	return result.hints.map((image: string) => {
        const rel = toRelativeIfSameOrigin(image, url);
        const hintType = safari && isCrossOrigin(image, url) ? 'preconnect' : 'preload';
        return `<${rel};rel=${hintType};as=image;crossorigin>`;
    });
};

export class GetHints extends Resource {
	allowRead(user: User) {
		return user?.role?.id === 'super_user';
	}

	async get(query: { url: string, safari?: string }) {
		const url = new URLSearchParams(query.url).get('q');
		const safari = query.safari === '1';

		if (!url) {
			return {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
				data: { error: 'Missing URL in "q" query parameter' },
			};
		}

		logger.info(`Fetching the early hints for URL: ${url}`);

		const productImages = await getProductImages(url, safari);
		const earlyHints = [...productImages].join(',');

		return { status: 200, headers: { 'Content-Type': 'application/json' }, data: earlyHints };
	}
}
