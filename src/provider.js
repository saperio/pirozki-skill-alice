const fetch = require('node-fetch');
const htmlParser = require('fast-html-parser');
const store = require('./store');
const { getHash } = require('./utils');
const { DB_PIES_BEST, DB_PIES_SEARCH } = require('./constants');


module.exports = { best, search };

async function fetchPage(url) {
	const raw = await fetch(url);
	const text = await raw.text();
	const dom = htmlParser.parse(text);
	const items = dom.querySelectorAll('.item-text');

	return items.map(item => {
		let text = '';
		for (let { tagName, rawText } of item.childNodes) {
			if (tagName === 'br') {
				text += '\n';
			} else {
				text += rawText;
			}
		}

		return {
			text: text.trim()
		};
	});
}

async function best(pieIdx) {
	const pageSize = 30;
	const pageIdx = 1 + (pieIdx / pageSize) | 0;
	const pageId = `page${pageIdx}`;

	let page = store.get(DB_PIES_BEST, pageId);
	if (!page) {
		const url = `http://poetory.ru/content/list?sort=rate&page=${pageIdx}&per-page=30`;
		page = await fetchPage(url);

		store.set(DB_PIES_BEST, pageId, page);
	}

	const idx = pieIdx % pageSize;
	if (idx >= page.length) {
		return null;
	}

	return page[idx];
}

async function search(term, searchIdx) {
	const pageSize = 30;
	const searchId = getHash(term);
	const checkRegex = new RegExp(`[^\\S]${term}[^\\S]`, 'gi');

	let cache = store.get(DB_PIES_SEARCH, searchId);
	if (!cache) {
		cache = { pages: {} };
	}

	// iterate pages
	while (true) {
		const pageIdx = 1 + (searchIdx / pageSize) | 0;
		const pageId = `page${pageIdx}`;

		let page = cache.pages[pageId];
		if (!page) {
			const url = `http://poetory.ru/content/list?sort=likes&query=${encodeURIComponent(term)}&page=${pageIdx}&per-page=30`;
			page = await fetchPage(url);

			// flag invalid (non-full word term) pies
			for (let pie of page) {
				if (!checkRegex.test(pie.text)) {
					pie.invalid = true;
				}
			}

			cache.pages[pageId] = page;
			store.set(DB_PIES_SEARCH, searchId, cache);
		}

		// iterate pies on page
		while (true) {
			const idx = searchIdx % pageSize;

			// go to next page
			if (idx === pageSize) {
				break;
			}

			if (idx >= page.length) {
				return null;
			}

			const { invalid, text } = page[idx];
			if (!invalid) {
				return { text, searchIdx };
			}

			searchIdx++;
		}
	}
}