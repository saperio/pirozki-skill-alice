const { STEP_NEW_USER } = require('./constants');

module.exports = { createUser };


function createUser(id) {
	return {
		step: STEP_NEW_USER,
		id
	};
}