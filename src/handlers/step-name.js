const { nextStep, checkCommand } = require('../utils');
const { STEP_MAIN, PAYLOAD_MORE } = require('../constants');
const { best, search } = require('../provider-utils');

module.exports = async function stepName({ user, command }) {
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
		const pies = await best(user);

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
	user.search = { term: name };

	const result = await search(user);
	if (result) {
		return {
			text: `${result}\n\nЕще?`,
			buttons
		};
	}

	const pies = await best(data);
	return {
		text: `${pies}\n\nЕще?`,
		buttons
	};
}