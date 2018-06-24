const { STEP_NEW_USER } = require('./constants');

module.exports = { createUser, nextStep, getRandomPieIdx, checkPayload };


function createUser(id) {
	return {
		step: STEP_NEW_USER,
		requestIdx: 0,
		inRow: 1,
		id
	};
}

function nextStep(user, step) {
	user.step = step;
}

function getRandomPieIdx(user) {
	let { bestContext } = user;
	if (!bestContext) {
		bestContext = {
			page: -1,
			idxList: []
		};
	}

	let { page, idxList } = bestContext;
	if (!idxList.length) {
		++page;
		idxList = Array.from({length: 10}, (_, i) => i);
	}

	const pieIdx = page * 10 + idxList.splice(Math.random() * idxList.length, 1)[0];
	user.bestContext = { page, idxList };

	return pieIdx;
}

function checkPayload(payload, checkValue) {
	if (!payload) {
		return false;
	}

	return payload.value === checkValue;
}