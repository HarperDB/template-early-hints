import { httpRequest } from 'http-request';
import { logger } from 'log';

const HARPER_INSTANCE_APPLICATION_URL = '[YOUR_HARPER_INSTANCE_APPLICATION_URL]';
const HARPER_INSTANCE_TOKEN = '[YOUR_BASE64_ENCODED_HARPER_USER:PASS]';
const ORIGIN_SITE_BASE_URL = "www.harpersystems.dev";

const OPTIONS = {
	method: 'GET',
	headers: {
		'Authorization': `Basic ${HARPER_INSTANCE_TOKEN}`,
		'Content-Type': 'application/json',
	},
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
	try {
		const userAgent = request.getHeader('User-Agent');

		if (isSafari(userAgent)) {
			request.setVariable('PMUSER_EH_BLOCK', '1');
		}

		const encodedPageUrl = encodeURIComponent(`${request.scheme}://${ORIGIN_SITE_BASE_URL}${request.url}`);

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

export function onClientResponse(request, response) {
  if (request.getVariable('PMUSER_EH_BLOCK') !== '1') return;

  if (response.status !== 200) return;
  const contentType = response.getHeader('Content-Type');
  if (contentType && !String(contentType).toLowerCase().includes('text/html')) return;

  const hints = request.getVariable('PMUSER_103_HINTS');
  if (!hints) return;

  // Parse and apply each Early Hint as a Link header for HTML responses for Safari
  hints.split(/\s*,\s*(?=<)/).forEach(entry => response.addHeader('Link', entry));
}
