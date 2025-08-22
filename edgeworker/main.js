import { httpRequest } from 'http-request';
import { logger } from 'log';

const HARPER_INSTANCE_APPLICATION_URL = '[YOUR_HARPER_INSTANCE_APPLICATION_URL]';
const HARPER_INSTANCE_TOKEN = '[YOUR_BASE64_ENCODED_HARPER_USER:PASS]';
const ORIGIN_SITE_BASE_URL = 'www.harpersystems.dev';

const OPTIONS = {
	method: 'GET',
	headers: {
		'Authorization': `Basic ${HARPER_INSTANCE_TOKEN}`,
		'Content-Type': 'application/json',
	},
	timeout: 50,
};

function isSafari(userAgent) {
	userAgent = String(userAgent).toLowerCase();

	const hasSafari = userAgent.includes('safari');
	const hasWebKit = userAgent.includes('applewebkit');
	const hasVersionTag = userAgent.includes('version/'); // Safari-specific token

	// Exclude other brands (desktop & iOS shells)
	const otherBrands = /(crios|chrome\/|chromium|edg\/|edgios|fxios|opr\/|opios|samsungbrowser|yabrowser|ucbrowser|brave|vivaldi|electron|duckduckgo)/;
	const isOther = otherBrands.test(userAgent);

	return hasWebKit && hasSafari && hasVersionTag && !isOther;
}

export async function onClientRequest(request) {
	const secFetchMode = request.getHeader('sec-fetch-mode');
	const hasNavigate = Array.isArray(secFetchMode)
		? secFetchMode.includes('navigate')
		: secFetchMode === 'navigate';
	if (!hasNavigate) {
		return;
	}

	try {
		const encodedPageUrl = encodeURIComponent(`${request.scheme}://${ORIGIN_SITE_BASE_URL}${request.url}`);
		
		const params = [`q=${encodedPageUrl}`];

		const userAgent = request.getHeader('User-Agent');
		if (isSafari(userAgent)) params.push('safari=1');

		const url = `https://${HARPER_INSTANCE_APPLICATION_URL}/hints?${params.join('&')}`;

		const response = await httpRequest(url, OPTIONS);

		if (response.status === 200) {
			const serialized = await response.json();
			if (serialized && typeof serialized === 'string') {
				request.setVariable('PMUSER_103_HINTS', serialized);
			}
		}
	} catch (exception) {
		logger.log(`Error occured while calling HDB: ${exception.message}`);
	}
}
