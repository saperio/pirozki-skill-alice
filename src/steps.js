const provider = require('./provider');
const { getRandomPieIdx, resetRandomPieIdx, nextStep, setUserFlag, checkUserFlag, checkCommand } = require('./utils');
const {
	STEP_NEW_USER,
	STEP_NAME,
	STEP_MAIN,
	STEP_COMEBACK,
	STEP_SEARCH,
	STEP_SEARCH_BEGIN,
	STEP_UNKNOWN,
	PAYLOAD_MORE,
	PAYLOAD_TWO_IN_ROW,
	PAYLOAD_THREE_IN_ROW,
	USER_FLAG_PROPOSE_ROW,
	USER_FLAG_PROPOSE_SEARCH
} = require('./constants');


module.exports = async function (data) {
	const { command, user } = data;
	const { step } = user;

	// check reject
	if (checkCommand(command, ['хватит', 'стоп', 'достаточно'])) {
		return {
			text: 'До встречи, приходи еще!',
			end_session: true
		}
	}

	preProcessData(data);

	let response = {};
	switch(step) {
		case STEP_NEW_USER:
			response = stepNewUser(data);
			break;

		case STEP_NAME:
			response = await stepName(data);
			break;

		case STEP_COMEBACK:
			response = await stepComeback(data);
			break;

		case STEP_SEARCH_BEGIN:
			response = await stepSearchBegin(data);
			break;

		case STEP_SEARCH:
			response = await stepSearch(data);
			break;

		case STEP_MAIN:
			response = await stepMain(data);
			break;
	}

	response = postProcessData(data, response);
	response = makeTTS(response);

	return response;
};

function preProcessData(data) {
	const { command, user, payload } = data;

	// first of all - check payload, for user pressed buttons
	if (payload) {
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

	// then check for predefined commands
	if (checkCommand(command, ['по два', 'по две'])) {
		user.inRow = 2;
	} else if (checkCommand(command, ['по три'])) {
		user.inRow = 3;
	} else if (checkCommand(command, ['давай лучшее', 'давай лучшие'])) {
		nextStep(user, STEP_MAIN);
	} else {
		const searchFlagIdx = command.indexOf('давай про');
		if (searchFlagIdx !== -1) {
			user.search = command
				.substring(searchFlagIdx + 9)
				.trim()
			;

			nextStep(user, STEP_SEARCH_BEGIN);
		}
	}

	if (user.step === STEP_UNKNOWN) {
		nextStep(user, STEP_MAIN);
	}
}

function postProcessData(data, response) {
	const { user } = data;

	if (user.step !== STEP_MAIN) {
		return response;
	}

	// and then make some purposes:
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

	// on 4 or more step propose search
	else if (user.requestIdx >= 4 && !checkUserFlag(user, USER_FLAG_PROPOSE_SEARCH)) {
		setUserFlag(user, USER_FLAG_PROPOSE_SEARCH);
		response.text += '\n\nЯ могу поискать пирожки на какую-нибудь тему, просто скажи «Давай про...»';
	}

	return response;
}

function makeTTS(response) {
	const { text } = response;
	const list = [
		['съебя', 'съеб+я'],
		['нахуй', 'н+ахуй']
	];

	let tts = text;
	for (let [search, replace] of list) {
		tts = tts.replace(new RegExp(search, 'g'), replace);
	}

	if (text !== tts) {
		response.tts = tts;
	}

	return response;
}

function stepNewUser({ user }) {
	nextStep(user, STEP_NAME);

	return {
		text: 'Привет! Я читаю стишки пирожки, меня зовут Абырвалг, а тебя как?'
	};
}

async function stepName(data) {
	const { user, command } = data;
	const buttons = [{
		title: 'Еще еще!!!',
		hide: true,
		payload: {
			value: PAYLOAD_MORE
		}
	}];

	nextStep(user, STEP_MAIN);

	// reject
	if (checkCommand(command, ['не ', 'нет ']) || command === 'нет') {
		const pies = await getPies(data);

		return {
			text: `Ладно, вот тебе первый пирожок!\n\n${pies}\n\nЕще?`,
			buttons
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

	const search = await provider.search(name, 0);
	if (search) {
		return {
			text: `${search.text}\n\nЕще?`,
			buttons
		};
	}

	const pies = await getPies(data);
	return {
		text: `${pies}\n\nЕще?`,
		buttons
	};
}

async function stepComeback(data) {
	const pies = await getPies(data);
	const { user } = data;

	nextStep(user, STEP_MAIN);

	return {
		text: `С возвращением!\n\n${pies}`
	};
}

async function stepMain(data) {
	const pies = await getPies(data);
	return {
		text: pies
	};
}

async function stepSearchBegin(data) {
	const { user } = data;
	const { search } = user;

	const result = await provider.search(search, 0);
	if (!result) {
		nextStep(user, STEP_UNKNOWN);
		user.search = null;

		return {
			text: `К сожалению ничего про «${search}» не нашлось. Попробуй выбрать что-то другое или просто скажи «Давай лучшее»`
		}
	}

	nextStep(user, STEP_SEARCH);
	user.searchIdx = 0;

	return {
		text: `Про «${search}» кое-что есть:\n${result.text}\n\nКогда надоест, попробуй выбрать что-то другое или просто скажи «Давай лучшее»`,
		buttons: [{
			title: 'Еще!',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		}]
	};
}

async function stepSearch(data) {
	const { user } = data;
	const { search } = user;

	const result = await provider.search(search, ++user.searchIdx);
	if (!result) {
		nextStep(user, STEP_UNKNOWN);
		user.search = null;
		user.searchIdx = null;

		return {
			text: `Про «${search}» это все. Можно поискать пирожки про что-то другое или просто скажи «Давай лучшее»`
		};
	}

	return {
		text: result.text,
		buttons: [{
			title: 'Еще!',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		}]
	};
}

async function getPies({ user }) {
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