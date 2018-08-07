const { nextStep } = require('../utils');
const { STEP_MAIN, PAYLOAD_MORE } = require('../constants');
const { best } = require('../provider-utils');


module.exports = function stepComeback({ user }) {
	const pies = best(user);

	nextStep(user, STEP_MAIN);
	return {
		text: `С возвращением!\n\n${pies}`,
		buttons: [{
			title: 'Еще еще!!!',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		}]
	};
}