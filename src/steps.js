const provider = require('./provider');
const { getRandomPieIdx, nextStep, setUserFlag, checkUserFlag } = require('./utils');
const {
	STEP_NEW_USER,
	STEP_NAME,
	STEP_MAIN,
	STEP_COMEBACK,
	PAYLOAD_MORE,
	PAYLOAD_TWO_IN_ROW,
	PAYLOAD_THREE_IN_ROW,
	USER_FLAG_PROPOSE_ROW,
	USER_FLAG_PROPOSE_SEARCH
} = require('./constants');


module.exports = async function (data) {
	const { payload, command, user } = data;
	const { step } = user;

	// first step
	if (step === STEP_NEW_USER) {
		return stepNewUser(data);
	}

	// second step
	if (step === STEP_NAME) {
		return await stepName(data);
	}

	// process reject
	if (
		command.indexOf('хватит') !== -1,
		command.indexOf('стоп') !== -1,
		command.indexOf('достаточно') !== -1
	) {
		return {
			text: 'До встречи, приходи еще!',
			end_session: true
		}
	}

	// process payload
	processPayload(user, payload);

	// preprocess command
	{
		if (command.indexOf('по два') || command.indexOf('по две')) {
			user.inRow = 2;
		} else if (command.indexOf('по три')) {
			user.inRow = 3;
		}
	}

	let response = {
		text: getPies(user)
	};

	if (step === STEP_COMEBACK) {
		nextStep(user, STEP_MAIN);

		response.text = `С возвращением!\n${response.text}`;
		return response;
	}

	// on 3 or more step propose to change rows
	if (user.requestIdx >= 3 && !checkUserFlag(user, USER_FLAG_PROPOSE_ROW)) {
		setUserFlag(user, USER_FLAG_PROPOSE_ROW);

		response.text += '\n\nА еще я могу читать по два или по три пирожка за раз, просто скажи «Давай по два»';
		response.buttons = [
			{
				title: 'Давай по два',
				hide: true,
				payload: {
					value: PAYLOAD_TWO_IN_ROW
				}
			},
			{
				title: 'Давай по три',
				hide: true,
				payload: {
					value: PAYLOAD_THREE_IN_ROW
				}
			}
		];
	}

	// on 5 or more step propose search
	else if (user.requestIdx >= 5 && !checkUserFlag(user, USER_FLAG_PROPOSE_SEARCH)) {
		setUserFlag(user, USER_FLAG_PROPOSE_SEARCH);
	}

	return response;
}

function stepNewUser({ user }) {
	nextStep(user, STEP_NAME);
	return 'Привет! Я читаю стишки пирожки, меня зовут Абырвалг, а тебя как?';
}

async function stepName({ user, command }) {
	nextStep(user, STEP_MAIN);

	const button = {
		title: 'Еще еще!!!',
		hide: true,
		payload: {
			value: PAYLOAD_MORE
		}
	};

	// reject
	if (command.indexOf('не ') !== -1 || command.indexOf('нет ') !== -1 || command === 'нет') {
		const pieIdx = getRandomPieIdx(user);
		const { text } = provider.best(pieIdx);

		return {
			text: `Ладно, вот тебе первый пирожок!\n${text}\n\nЕще?`,
			buttons: [button]
		};
	}

	// cleanup name
	const name = command
		.replace('а ', '')
		.replace('меня ', '')
		.replace('зовут ', '')
		.replace('я ', '')
		.trim()
	;
	user.name = name;

	const pies = await provider.search(name);
	if (pies.length) {
		return {
			text: `${pies[0].text}\n\nЕще?`,
			buttons: [button]
		};
	}

	const pieIdx = getRandomPieIdx(user);
	const { text } = await provider.best(pieIdx);

	return {
		text: `${text}\n\nЕще?`,
		buttons: [button]
	};
}

function getPies(user) {
	const { inRow } = user;

	let resText = '';
	for (let i = 0; i < inRow; ++i) {
		const pieIdx = getRandomPieIdx(user);
		const { text } = provider.best(pieIdx);

		resText += i !== 0 ? `\n\n${text}` : text;
	}

	return resText;
}

function processPayload(user, payload) {
	if (!payload) {
		return;
	}

	switch (payload.value) {
		case PAYLOAD_MORE:
			break;

		case PAYLOAD_TWO_IN_ROW:
			user.inRow = 2;
			break;

		case PAYLOAD_THREE_IN_ROW:
			user.inRow = 3;
			break;
	}
}