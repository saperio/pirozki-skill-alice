const hash = require('crypto').createHash;
const { STEP_UNKNOWN, STEP_NEW_USER } = require('./constants');

module.exports = { createUser, nextStep, setUserFlag, checkUserFlag, checkCommand, getHash, initSearch, getHowto };


function createUser(id) {
	return {
		step: STEP_NEW_USER,
		stepPrev: STEP_UNKNOWN,
		requestIdx: 0,
		inRow: 1,
		flag: 0,
		id
	};
}

function nextStep(user, step) {
	user.stepPrev = user.step;
	user.step = step;
}

function setUserFlag(user, flag) {
	user.flag |= flag;
}

function checkUserFlag(user, flag) {
	return !!(user.flag & flag);
}

function checkCommand(command, terms) {
	return terms.some(term => command.indexOf(term) !== -1);
}

function getHash(str) {
	return hash('sha1').update(str).digest('hex');
}

function initSearch(user, term) {
	if ((/[<>;:(){}@$%&?*/\\]/g).test(term)) {
		user.search = {};
		return;
	}

	user.search = {
		term: term.trim().toLowerCase(),
		searchIdx: -1
	};
}

function getHowto() {
	const text =
		'Вот, что я умею:\n' +
		'В основном режиме я просто читаю лучшие пирожки. Ты всегда можешь выбрать сколько ' +
		'за раз - по одному, два или три, сказав, например, «Давай по два»!\n' +
		'Еще я могу поискать пирожки на какую-нибудь тему, просто скажи «Давай про...». Чтобы вернуться к лучшему, скажи «Давай лучшее».\n' +
		'Ок?'
	;
	const tts =
		'Вот, что я умею\n\n' +
		'В основном режиме я просто читаю лучшие пирожки. Ты всегда можешь выбрать сколько ' +
		'за раз - по одному, два или три, сказав, например, Давай по два!\n\n' +
		'Еще я могу поискать пирожки на какую-нибудь тему, просто скажи Давай пр+о. Чтобы вернуться к лучшему, скажи Давай лучшее.\n\n' +
		'Ок?'
	;

	return { text, tts };
}