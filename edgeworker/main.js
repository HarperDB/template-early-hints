import { httpRequest } from 'http-request';
import { logger } from 'log';

const HARPER_INSTANCE_APPLICATION_URL = '[YOUR_HARPER_INSTANCE_APPLICATION_URL]';
const HARPER_INSTANCE_TOKEN = '[YOUR_BASE64_ENCODED_HARPER_USER:PASS]';

const staticPreconnectHosts = [
	'https://fonts.googleapis.com',
];

const OPTIONS = {
	method: 'GET',
	headers: {
		'Authorization': `Basic ${HARPER_INSTANCE_TOKEN}`,
		'Content-Type': 'application/json',
	},
	timeout: 250,
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
		const encodedPageUrl = encodeURIComponent(`${request.scheme}://${request.host}${request.url}`);
		const userAgent = request.getHeader('User-Agent');

		// For Safari, add static preconnect headers directly since Safari doesn’t support Early Hints. This reduces latency and ensures external resources are preconnected.
		const safariHints = [];
		if (isSafari(userAgent)) {
			staticPreconnectHosts.forEach(host => {
				safariHints.push(`<${host}>;rel=preconnect;crossorigin`);
			});
		}

		if (safariHints.length > 0) {
			const hintString = safariHints.join(',');
			request.setVariable('PMUSER_103_HINTS', hintString);
			return;
		}

		const url = `https://${HARPER_INSTANCE_APPLICATION_URL}/hints?q=${encodedPageUrl}`;

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
