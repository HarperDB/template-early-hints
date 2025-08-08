import { Resource, databases, logger } from 'harperdb';
import { AllowedUserRoles, } from '../constants/index.js';
const { ProductImages: ProductImagesTable, } = databases.EarlyHints;
const getProductImages = async (url) => {
    logger.info(`Fetching product images for URL: ${url}`);
    const result = await ProductImagesTable.get(url);
    if (!result?.hints) {
        return [];
    }
    return result.hints.map((image) => `<${image};rel=preload;as=image;crossorigin>`);
};
export class GetHints extends Resource {
    allowRead(user) {
        return user?.role?.id === AllowedUserRoles.SUPER_USER || user?.role?.id === AllowedUserRoles.READ_ONLY;
    }
    async get(query) {
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
