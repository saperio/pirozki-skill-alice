const provider = require('./provider');


module.exports = { best, search };

async function best(user) {
	const { inRow } = user;

	const pies = [];
	for (let i = 0; i < inRow; ++i) {
		const pieIdx = getRandomPieIdx(user);
		let pie = await provider.best(pieIdx);
		if (!pie) {
			resetRandomPieIdx(user);
			pies.push('Ого, у меня кончились лучшие пирожки, начну сначала пожалуй!');
			break;
		}

		pies.push(pie.text);
	}

	return pies.join('\n\n');
}

async function search(user) {
	let { term, searchIdx } = user.search;
	if ((/[<>;:(){}@$%&?*/\\]/g).test(term)) {
		user.search = {};
		return null;
	}

	if (searchIdx === undefined) {
		searchIdx = 0;
	} else {
		++searchIdx;
	}

	user.search.searchIdx = searchIdx;

	const result = await provider.search(term, searchIdx);
	if (!result) {
		user.search = {};
		return null;
	}

	return result.text;
}

function getRandomPieIdx(user) {
	let { bestContext } = user;
	if (!bestContext) {
		bestContext = {
			page: -1,
			idxList: []
		};
	}

	const pageSize = 10;
	let { page, idxList } = bestContext;
	if (!idxList.length) {
		++page;
		idxList = Array.from({ length: pageSize }, (_, i) => i);
	}

	const pieIdx = page * pageSize + idxList.splice(Math.random() * idxList.length, 1)[0];
	user.bestContext = { page, idxList };

	return pieIdx;
}

function resetRandomPieIdx(user) {
	user.bestContext = null;
}