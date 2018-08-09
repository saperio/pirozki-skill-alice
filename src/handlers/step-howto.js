const { nextStep, getHowto } = require('../utils');
const { STEP_MAIN } = require('../constants');

module.exports = function stepNewUser({ user }) {
	nextStep(user, STEP_MAIN);
	return getHowto();
}