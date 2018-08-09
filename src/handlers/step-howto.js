const { nextStep, getHowto } = require('../utils');
const { STEP_MAIN, PAYLOAD_TWO_IN_ROW, PAYLOAD_THREE_IN_ROW } = require('../constants');


module.exports = function stepNewUser({ user }) {
	nextStep(user, STEP_MAIN);

	const buttons = [
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

	return {
		...getHowto(),
		buttons
	};
}