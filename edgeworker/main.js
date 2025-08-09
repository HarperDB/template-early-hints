import { httpRequest } from 'http-request';
import { logger } from 'log';
import { createCache } from 'cache';

const HARPER_TOKEN = '';
const HARPER_BASE_URL = '';
const PMUSER_103_HINTS = 'PMUSER_103_HINTS';
const cache = createCache('early-hints-cache');

const OPTIONS = {
	method: 'GET',
	headers: {
		'Authorization': `Basic ${HARPER_TOKEN}`,
		'Content-Type': 'application/json',
	},
	timeout: 50
};

export async function onClientRequest(request) {
	if (!isMainDocumentNavigation(request)) return;

	try {
		const cacheKey = `${request.scheme}://${request.host}${request.url}`;
		let serialized = await cache.get(cacheKey);

		if (!serialized) {
			const encodedPageUrl = encodeURIComponent(cacheKey);
			const url = `${HARPER_BASE_URL}/${encodedPageUrl}?select(serializedLinks)`;
			const response = await httpRequest(url, OPTIONS);
			if (response.status === 200) {
				serialized = await response.json();
				if (serialized && typeof serialized === 'string') {
					await cache.set(cacheKey, serialized, { ttl: 300 }); // cache for 5 minutes
				}
			}
		}

		if (serialized && typeof serialized === 'string') {
			request.setVariable(PMUSER_103_HINTS, serialized);
		}
	} catch (exception) {
		logger.log(`Error occured while calling HDB: ${exception.message}`);
	}
}
