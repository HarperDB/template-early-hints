import Papa from 'papaparse';

databases.earlyhints.Page.setComputedAttribute('serializedLinks', (record) => {
    return record.links.map((data) => {
        const { href, ...props } = data.toJSON();
        let serialized = `<${href}>;`;
        serialized += Object.entries(props).map(([key, value]) => `${key}${value ? `=${value}` : ''}`).join(';')
        return serialized;
    }).join(', ');
});

export class Page extends databases.earlyhints.Page {
    async post(data) {
        const errors = [];

        const pageLinks = getPageLinksFromData(data);

        const linksByPageUrl = {};

        for (const pageLink of pageLinks) {
            const validationErrors = validateLink(pageLink);
            if (validationErrors.length) {
                errors.push({
                    errors: validationErrors,
                    link: pageLink,
                });

            } else {
                const { pageUrl, ...link } = pageLink;

                if (!linksByPageUrl[pageUrl]) {
                    linksByPageUrl[pageUrl] = [];
                }

                linksByPageUrl[pageUrl].push(link);
            }
        }

        await Promise.all(Object.entries(linksByPageUrl).map(async ([url, links]) => {
            let page = await Page.get(url);
            if (!page) {
                page = await Page.create({ url, links });
            } else {
                page.links = links;
                await page.update();
            }
        }));

        return {
            errors
        }
    }
}

function validateLink(link) {
    const errors = [];
    const isObject = link && typeof link === 'object' && Array.isArray(link) === false;
    if (!isObject) {
        errors.push('Link must be an object');
    } else {
        if (!link.pageUrl) {
            errors.push('Missing pageUrl');
        }
        if (!link.href) {
            errors.push('Missing href');
        }
        if (link.rel !== 'preload' && link.rel !== 'preconnect') {
            errors.push('rel must be "preload" or "preconnect"');
        }
    }

    return errors;
}

function getPageLinksFromData(data) {
    let pageLinks = [];

    if (data.contentType == 'text/csv') {
        pageLinks = Papa.parse(data.data, {
            header: true,
            skipEmptyLines: true
        })?.data;
    }
    else {
        pageLinks = data
    }

    return pageLinks;
}