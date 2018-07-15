const { nextStep } = require('../utils');
const { STEP_UNKNOWN, PAYLOAD_MORE } = require('../constants');
const { search } = require('../provider-utils');

module.exports = async function stepSearch({ user }) {
	const { term } = user.search;

	const result = await search(user);
	if (!result) {
		nextStep(user, STEP_UNKNOWN);
		return {
			text: `Про «${term}» это все. Можно поискать пирожки про что-то другое или просто скажи «Давай лучшее»`
		};
	}

	return {
		text: result.text,
		buttons: [{
			title: 'Еще!',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		}]
	};
}