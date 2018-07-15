const { nextStep } = require('../utils');
const { STEP_NAME } = require('../constants');

module.exports = function stepNewUser({ user }) {
	nextStep(user, STEP_NAME);

	return {
		text: 'Привет! Я читаю стишки пирожки, меня зовут Абырвалг, а тебя как?'
	};
}