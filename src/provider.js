const fetch = require('node-fetch');
const htmlParser = require('fast-html-parser');
const store = require('./store');
const { getHash } = require('./utils');
const { DB_PIES_BEST, DB_PIES_SEARCH } = require('./constants');


module.exports = { init, best, search, PROVIDER_STATUS };

const pageSize = 30;
const PROVIDER_STATUS = {
	STATUS_OK: 1,
	STATUS_NOT_READY: 2,
	STATUS_END: 3
}

let fetchQueue = [];

function init() {
	const prefetchPages = 2;
	for (let i = 0; i < prefetchPages; ++i) {
		fetchBest(i * pageSize);
	}
}

function best(pieIdx) {
	const { pageId } = getPageData(pieIdx);

	let page = store.getInstant(DB_PIES_BEST, pageId);
	if (!page) {
		fetchBest(pieIdx);
		return { status: PROVIDER_STATUS.STATUS_NOT_READY };
	}

	const idx = pieIdx % pageSize;
	if (idx >= page.length) {
		return { status: PROVIDER_STATUS.STATUS_END };
	}

	// prefetch next page, if needed
	const pieIdxNext = pieIdx + pageSize;
	const pageNext = getPageData(pieIdxNext);
	if (!store.getInstant(DB_PIES_BEST, pageNext.pageId)) {
		fetchBest(pieIdxNext);
	}

	const { text } = page[idx];
	return { text, status: PROVIDER_STATUS.STATUS_OK };
}

function search(term, searchIdx) {
	const searchId = getHash(term);

	let cache = store.getInstant(DB_PIES_SEARCH, searchId);
	if (!cache) {
		cache = { pages: {} };
	}

	// iterate pages
	while (true) {
		const { pageId } = getPageData(searchIdx);

		let page = cache.pages[pageId];
		if (!page) {
			fetchSearch(searchIdx, term);
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
				// prefetch next page, if needed
				const searchIdxNext = searchIdx + pageSize;
				const pageNext = getPageData(searchIdxNext);
				if (!cache.pages[pageNext.pageId]) {
					fetchSearch(searchIdxNext, term);
				}

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

function getPageData(idx) {
	const pageIdx = 1 + (idx / pageSize) | 0;
	const pageId = `page${pageIdx}`;

	return { pageIdx, pageId };
}

function fetchBest(pieIdx) {
	const { pageIdx, pageId } = getPageData(pieIdx);
	const url = `http://poetory.ru/content/list?sort=rate&page=${pageIdx}&per-page=${pageSize}`;
	const cb = page => {
		store.set(DB_PIES_BEST, pageId, page);
	}

	pushQueue({ url, cb });
}

function fetchSearch(searchIdx, term) {
	const searchId = getHash(term);
	const { pageIdx, pageId } = getPageData(searchIdx);
	const url = `http://poetory.ru/content/list?sort=likes&query=${encodeURIComponent(term)}&page=${pageIdx}&per-page=${pageSize}`;
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
	const item = fetchQueue[0];
	if (!item || item.progress) {
		return;
	}

	const { url, cb } = item;

	item.progress = true;
	fetchPage(url)
		.then(page => {
			cb(page);
			fetchQueue.shift();
			updateQueue();
		})
		.catch(reason => {
			console.error(`Failed fetch '${url}' with reason: ${reason}`);
			fetchQueue.shift();
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