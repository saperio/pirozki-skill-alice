const { nextStep, checkCommand, initSearch, getHowto } = require('../utils');
const { STEP_NAME_RESULT } = require('../constants');
const { search } = require('../provider-utils');


module.exports = function stepName({ user, command }) {
	nextStep(user, STEP_NAME_RESULT);

	// reject
	if (checkCommand(command, ['не ', 'нет ', 'неважно']) || command === 'нет') {
		return getHowto();
	}

	// cleanup name
	const name = command
		.replace('а ', '')
		.replace('меня ', '')
		.replace('зовут ', '')
		.replace('я ', '')
	;

	user.name = name;
	initSearch(user, name);
	search(user);

	return getHowto();
}