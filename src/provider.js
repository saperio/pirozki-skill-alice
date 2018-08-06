const fetch = require('node-fetch');
const htmlParser = require('fast-html-parser');
const store = require('./store');
const { getHash } = require('./utils');
const { DB_PIES_BEST, DB_PIES_SEARCH } = require('./constants');


module.exports = { best, search, PROVIDER_STATUS };

const PROVIDER_STATUS = {
	STATUS_OK: 1,
	STATUS_NOT_READY: 2,
	STATUS_END: 3
}

let fetchQueue = [];

function best(pieIdx) {
	const pageSize = 30;
	const pageIdx = 1 + (pieIdx / pageSize) | 0;
	const pageId = `page${pageIdx}`;

	let page = store.getInstant(DB_PIES_BEST, pageId);
	if (!page) {
		fetchBest(pageId, pageIdx);
		return { status: PROVIDER_STATUS.STATUS_NOT_READY };
	}

	const idx = pieIdx % pageSize;
	if (idx >= page.length) {
		return { status: PROVIDER_STATUS.STATUS_END };
	}

	const { text } = page[idx];
	return { text, status: PROVIDER_STATUS.STATUS_OK };
}

function search(term, searchIdx) {
	const pageSize = 30;
	const searchId = getHash(term);

	let cache = store.getInstant(DB_PIES_SEARCH, searchId);
	if (!cache) {
		cache = { pages: {} };
	}

	// iterate pages
	while (true) {
		const pageIdx = 1 + (searchIdx / pageSize) | 0;
		const pageId = `page${pageIdx}`;

		let page = cache.pages[pageId];
		if (!page) {
			fetchSearch(pageId, pageIdx, term, searchId);
			return { status: PROVIDER_STATUS.STATUS_NOT_READY };
		}

		// iterate pies on page
		while (true) {
			const idx = searchIdx % pageSize;
			if (idx >= page.length) {
				return { status: PROVIDER_STATUS.STATUS_END };
			}

			const { invalid, text } = page[idx];
			if (!invalid) {
				return { text, searchIdx, status: PROVIDER_STATUS.STATUS_OK };
			}

			searchIdx++;

			// go to next page
			if (searchIdx % pageSize === 0) {
				break;
			}
		}
	}
}

function fetchBest(pageId, pageIdx) {
	const url = `http://poetory.ru/content/list?sort=rate&page=${pageIdx}&per-page=30`;
	const cb = page => {
		store.set(DB_PIES_BEST, pageId, page);
	}

	pushQueue({ url, cb });
}

function fetchSearch(pageId, pageIdx, term, searchId) {
	const url = `http://poetory.ru/content/list?sort=likes&query=${encodeURIComponent(term)}&page=${pageIdx}&per-page=30`;
	const cb = page => {
		// flag invalid (non-full word term) pies
		for (let pie of page) {
			const checkRegex = new RegExp(`\\s+${term}\\s+`, 'gi');
			if (!checkRegex.test(pie.text)) {
				pie.invalid = true;
			}
		}

		let cache = store.getInstant(DB_PIES_SEARCH, searchId);
		if (!cache) {
			cache = { pages: {} };
		}

		cache.pages[pageId] = page;
		store.set(DB_PIES_SEARCH, searchId, cache);
	};

	pushQueue({ url, cb });
}

function pushQueue(item) {
	for (let { url } of fetchQueue) {
		if (item.url === url) {
			return;
		}
	}

	fetchQueue.push(item);
	updateQueue();
}

function updateQueue() {
	const item = fetchQueue.shift();
	if (!item) {
		return;
	}

	const { url, cb } = item;
	fetchPage(url)
		.then(page => {
			cb(page);
			updateQueue();
		})
		.catch(reason => {
			console.error(`Failed fetch '${url}' with reason: ${reason}`);
			updateQueue();
		})
	;
}

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