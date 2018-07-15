const { nextStep } = require('../utils');
const { STEP_SEARCH, STEP_UNKNOWN, PAYLOAD_MORE } = require('../constants');
const { search } = require('../provider-utils');

module.exports = async function stepSearchBegin({ user }) {
	const { term } = user.search;

	const result = await search(user);
	if (!result) {
		nextStep(user, STEP_UNKNOWN);
		return {
			text: `К сожалению ничего про «${term}» не нашлось. Попробуй выбрать что-то другое или просто скажи «Давай лучшее»`
		}
	}

	nextStep(user, STEP_SEARCH);
	return {
		text: `Про «${term}» кое-что есть:\n${result}\n\nКогда надоест, попробуй выбрать что-то другое или просто скажи «Давай лучшее»`,
		buttons: [{
			title: 'Еще!',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		}]
	};
}