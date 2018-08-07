const { nextStep, setUserFlag, checkUserFlag, checkCommand, initSearch } = require('./utils');
const {
	STEP_NEW_USER,
	STEP_NAME,
	STEP_NAME_RESULT,
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
const stepNewUser = require('./handlers/step-new-user');
const stepName = require('./handlers/step-name');
const stepNameResult = require('./handlers/step-name-result');
const stepComeback = require('./handlers/step-comeback');
const stepSearchBegin = require('./handlers/step-search-begin');
const stepSearch = require('./handlers/step-search');
const stepMain = require('./handlers/step-main');

const stepHandlers = {
	[STEP_NEW_USER]: stepNewUser,
	[STEP_NAME]: stepName,
	[STEP_NAME_RESULT]: stepNameResult,
	[STEP_COMEBACK]: stepComeback,
	[STEP_SEARCH_BEGIN]: stepSearchBegin,
	[STEP_SEARCH]: stepSearch,
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
			const term = command.substring(searchFlagIdx + 10);
			initSearch(user, term);
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

		response.text += '\n\nА еще я могу читать по два или по три пирожка за раз, просто скажи «Давай по два» или «еще», чтобы ничего не менять';
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
	const { text, tts } = response;
	const list = [
		['съебя', 'съеб+я'],
		['нахуй', 'н+ахуй'],
		['\n\n', '------']
	];

	const original = tts || text;
	let ttsConverted = original;
	for (let [search, replace] of list) {
		ttsConverted = tts.replace(new RegExp(search, 'g'), replace);
	}

	if (original !== ttsConverted) {
		response.tts = ttsConverted;
	}

	if (text === response.tts) {
		delete response.tts;
	}

	return response;
}