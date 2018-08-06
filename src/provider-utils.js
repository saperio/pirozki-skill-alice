const provider = require('./provider');
const { PROVIDER_STATUS } = provider;


module.exports = { best, search };

function best(user) {
	const { inRow } = user;

	const pies = [];
	for (let i = 0; i < inRow; ++i) {
		const pieIdx = getRandomPieIdx(user);
		const { text, status } = provider.best(pieIdx);
		if (status === PROVIDER_STATUS.STATUS_END) {
			resetRandomPieIdx(user);
			pies.push('Ого, у меня кончились лучшие пирожки, начну сначала пожалуй!');
			break;
		} else if (status === PROVIDER_STATUS.STATUS_NOT_READY) {
			pies.push('Что-то пошло не так, повторите «Все будет хорошо» два раза и все исправится!');
			break;
		}

		pies.push(text);
	}

	return pies.join('\n\n');
}

function search(user) {
	let { term, searchIdx } = user.search;
	if (!term) {
		user.search = {};
		return null;
	}

	const result = provider.search(term, ++searchIdx);
	const { status, text } = result;
	if (status === PROVIDER_STATUS.STATUS_END) {
		user.search = {};
		return null;
	} else if (status === PROVIDER_STATUS.STATUS_NOT_READY) {
		return null;
	}

	user.search.searchIdx = result.searchIdx;
	return text;
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