const { nextStep, initSearch } = require('../utils');
const { STEP_MAIN } = require('../constants');
const { best, search } = require('../provider-utils');


module.exports = function stepNameResult({ user }) {
	nextStep(user, STEP_MAIN);

	// try again - serch made on prev step and must be complete at this point
	// otherwise skip it
	// re-init to reset searchIdx
	initSearch(user, user.name);

	const result = search(user);
	if (result) {
		return {
			text: `Про тебя кое-что есть:\n\n${result}\n\nА дальше я буду читать из списка лучших. Поехали?`
		};
	}

	const pies = best(user);
	return {
		text: `Класс! Ну поехали:\n\n${pies}\n\nЕще?`
	};
}