import { httpRequest } from 'http-request';
import { logger } from 'log';

const HARPER_TOKEN = '';
const HARPER_BASE_URL = '';
const PMUSER_103_HINTS = 'PMUSER_103_HINTS';

const OPTIONS = {
	method: 'GET',
	headers: {
		'Authorization': `Basic ${HARPER_TOKEN}`,
		'Content-Type': 'application/json',
	},
};

export async function onClientRequest(request) {
	if (!isMainDocumentNavigation(request)) return;
	try {
		const encodedPageUrl = encodeURIComponent(`${request.scheme}://${request.host}${request.url}`);

		const url = `${HARPER_BASE_URL}/${encodedPageUrl}?select(serializedLinks)`;

		const response = await httpRequest(url, OPTIONS);

		if (response.status === 200) {
			const serialized = await response.json();
			if (serialized && typeof serialized === 'string') {
				request.setVariable(PMUSER_103_HINTS, serialized);
			}
		}
	} catch (exception) {
		logger.log(`Error occured while calling HDB: ${exception.message}`);
	}
}
