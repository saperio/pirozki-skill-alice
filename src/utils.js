const hash = require('crypto').createHash;
const { STEP_NEW_USER } = require('./constants');

module.exports = { createUser, nextStep, setUserFlag, checkUserFlag, checkCommand, getHash };


function createUser(id) {
	return {
		step: STEP_NEW_USER,
		requestIdx: 0,
		inRow: 1,
		flag: 0,
		id
	};
}

function nextStep(user, step) {
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