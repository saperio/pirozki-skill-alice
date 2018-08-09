const { nextStep, checkCommand, initSearch } = require('./utils');
const {
	STEP_NEW_USER,
	STEP_NAME,
	STEP_NAME_RESULT,
	STEP_MAIN,
	STEP_COMEBACK,
	STEP_SEARCH,
	STEP_SEARCH_BEGIN,
	STEP_HOWTO,
	STEP_UNKNOWN,
	PAYLOAD_MORE,
	PAYLOAD_TWO_IN_ROW,
	PAYLOAD_THREE_IN_ROW
} = require('./constants');
const stepNewUser = require('./handlers/step-new-user');
const stepName = require('./handlers/step-name');
const stepNameResult = require('./handlers/step-name-result');
const stepComeback = require('./handlers/step-comeback');
const stepSearchBegin = require('./handlers/step-search-begin');
const stepSearch = require('./handlers/step-search');
const stepHowto = require('./handlers/step-howto');
const stepMain = require('./handlers/step-main');

const stepHandlers = {
	[STEP_NEW_USER]: stepNewUser,
	[STEP_NAME]: stepName,
	[STEP_NAME_RESULT]: stepNameResult,
	[STEP_COMEBACK]: stepComeback,
	[STEP_SEARCH_BEGIN]: stepSearchBegin,
	[STEP_SEARCH]: stepSearch,
	[STEP_HOWTO]: stepHowto,
	[STEP_MAIN]: stepMain
};


module.exports = function steps(data) {
	const { command, user } = data;

	// check reject
	if (checkCommand(command, ['хватит', 'стоп', 'достаточно'])) {
		return {
			text: 'До встречи, приходи еще!',
			end_session: true
		}
	}

	preProcessData(data);

	const stepHandler = stepHandlers[user.step];
	if (!stepHandler) {
		throw `No step handler for ${user.step} step`;
	}

	let response = stepHandler(data);
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
	if (checkCommand(command, ['по два', 'по две', 'по 2'])) {
		user.inRow = 2;
	} else if (checkCommand(command, ['по три', 'по 3'])) {
		user.inRow = 3;
	} else if (checkCommand(command, ['давай лучшее', 'давай лучшие'])) {
		nextStep(user, STEP_MAIN);
	} else if (checkCommand(command, ['что ты умеешь', 'что ты можешь'])) {
		nextStep(user, STEP_HOWTO);
	} else {
		let term;
		const triggers = [
			'давай про'
		];
		for (let trigger of triggers) {
			const idx = command.indexOf(trigger);
			if (idx !== -1) {
				term = command.substring(idx + trigger.length + 1);
				break;
			}
		}

		if (term) {
			initSearch(user, term);
			nextStep(user, STEP_SEARCH_BEGIN);
		}
	}

	if (user.step === STEP_UNKNOWN) {
		nextStep(user, STEP_MAIN);
	}
}

function makeTTS(response) {
	const { text, tts } = response;
	const list = [
		['съебя', 'съеб+я'],
		['нахуй', 'н+ахуй'],
		['\n\n', '- - - - - -']
	];

	const original = tts || text;
	let ttsConverted = original;
	for (let [search, replace] of list) {
		ttsConverted = ttsConverted.replace(new RegExp(search, 'g'), replace);
	}

	if (original !== ttsConverted) {
		response.tts = ttsConverted;
	}

	if (text === response.tts) {
		delete response.tts;
	}

	return response;
}