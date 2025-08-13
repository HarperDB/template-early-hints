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
	timeout: 50,
};

export async function onClientRequest(request) {
	try {
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
