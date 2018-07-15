const { best } = require('../provider-utils');

module.exports = async function stepMain({ user }) {
	const text = await best(user);

	return { text };
}