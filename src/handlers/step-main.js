const { best } = require('../provider-utils');
const { PAYLOAD_MORE } = require('../constants');

module.exports = function stepMain({ user }) {
	const text = best(user);

	return {
		text,
		buttons: [{
			title: 'Дальше',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		}]
	};
}