const fetch = require('node-fetch');
const htmlParser = require('fast-html-parser');
const store = require('./store');
const { DB_PIES } = require('./constants');


module.exports = { init, best, search };

async function init() {
	/*console.log('Init provider...');

	let best = store.get(DB_PIES, 'best');
	if (best) {
		return;
	}

	best = [];
	for (let page = 0; page < 2; ++page) {
		best = best.concat(await fetchBest(page));
	}

	store.set(DB_PIES, 'best', best);

	console.log(`fetch ${best.length} best pies`);
	*/

	const pies = await search('Антон');
	console.log(`fetch ${pies.length} pies:\n\n${pies[0].text}`);
}

async function fetchBest(page) {
	const url = `http://poetory.ru/content/list?sort=rate&page=${page + 1}&per-page=30`;
	const best = await fetchPage(url);

	if (!best.length) {
		throw 'Can\'t parse best list';
	}
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

function best(pieIdx) {
	const best = store.get(DB_PIES, 'best');

	return best[pieIdx];
}

async function search(term) {
	if ((/[<>;:(){}@$%&?*/\\]/g).test(term)) {
		return [];
	}

	const url = `http://poetory.ru/content/list?sort=likes&query=${encodeURIComponent(term)}`;
	return await fetchPage(url);
}