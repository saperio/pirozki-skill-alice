const { best } = require('../provider-utils');

module.exports = function stepMain({ user }) {
	const text = best(user);

	return { text };
}