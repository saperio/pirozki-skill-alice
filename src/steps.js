const provider = require('./provider');
const { getRandomPieIdx, checkPayload, nextStep } = require('./utils');
const {
	STEP_NEW_USER,
	STEP_NAME,
	STEP_MAIN,
	STEP_COMEBACK,
	PAYLOAD_MORE,
	PAYLOAD_TWO_IN_ROW,
	PAYLOAD_THREE_IN_ROW
} = require('./constants');


module.exports = async function realsteps(data) {
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
	if (payload) {
		if (checkPayload(payload, PAYLOAD_MORE)) {
		} else if (checkPayload(payload, PAYLOAD_TWO_IN_ROW)) {
			user.inRow = 2;
		} else if (checkPayload(payload, PAYLOAD_THREE_IN_ROW)) {
			user.inRow = 3;
		}
	}

	// preprocess command
	else {
		if (command.indexOf('по два') || command.indexOf('по две')) {
			user.inRow = 2;
		} else if (command.indexOf('по три')) {
			user.inRow = 3;
		}
	}

	let response = {
		text: stepMain(data)
	};

	// on third or more step propose to change rows
	if (user.requestIdx >= 3 && !user.proposeRows) {
		user.proposeRows = true;

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

	if (step === STEP_COMEBACK) {
		response.text = `С возвращением!\n${response.text}`;
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
		.replace('а', '')
		.replace('меня', '')
		.replace('зовут', '')
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

function stepMain({ user }) {
	const { inRow } = user;

	let resText = '';
	for (let i = 0; i < inRow; ++i) {
		const pieIdx = getRandomPieIdx(user);
		const { text } = provider.best(pieIdx);

		resText += i !== 0 ? `\n${text}` : text;
	}

	return resText;
}