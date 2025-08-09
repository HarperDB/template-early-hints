import { Resource, databases, logger } from 'harperdb';
import type { User } from '../types/index.js';
import { toRelativeIfSameOrigin, guessAsType } from '../utils/urlHelpers.js';

const {
	ProductImages: ProductImagesTable,
} = databases.EarlyHints;

const getProductImages = async (url: string) => {
	logger.info(`Fetching product images for URL: ${url}`);

	const result = await ProductImagesTable.get(url);

	if (!result?.hints) {
		return [];
	}

	return result.hints.map((assetUrl: string) => {
		const rel = toRelativeIfSameOrigin(assetUrl, url);
		const asType = guessAsType(assetUrl);
		return `<${rel};rel=preload;as=${asType};crossorigin>`;
	});
};

export class GetHints extends Resource {
	allowRead(user: User) {
		return user?.role?.id === 'super_user';
	}

	async get(query: { url: string }) {
		const url = new URLSearchParams(query.url).get('q');

		if (!url) {
			return {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
				data: { error: 'Missing URL in "q" query parameter' },
			};
		}

		logger.info(`Fetching the early hints for URL: ${url}`);

		const productImages = await getProductImages(url);
		const earlyHints = [...productImages].join(',');

		return { status: 200, headers: { 'Content-Type': 'application/json' }, data: earlyHints };
	}
}
