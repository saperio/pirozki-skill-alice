const { STEP_NEW_USER, PAYLOAD_TWO_IN_ROW, PAYLOAD_THREE_IN_ROW } = require('./constants');

module.exports = { createUser, getRandomPieIdx, checkPayload, preprocessPayload, preprocessCommand };


function createUser(id) {
	return {
		step: STEP_NEW_USER,
		requestIdx: 0,
		inRow: 1,
		id
	};
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

function preprocessPayload(payload, user) {
	if (checkPayload(payload, PAYLOAD_TWO_IN_ROW)) {
		user.inRow = 2;
	} else if (checkPayload(payload, PAYLOAD_THREE_IN_ROW)) {
		user.inRow = 3;
	}
}

function preprocessCommand(command, user) {
	if (command.indexOf('по два') || command.indexOf('по две')) {
		user.inRow = 2;
	} else if (command.indexOf('по три')) {
		user.inRow = 3;
	}
}