const { nextStep } = require('../utils');
const { STEP_SEARCH, STEP_UNKNOWN, PAYLOAD_MORE } = require('../constants');
const { search } = require('../provider-utils');


module.exports = function stepSearchBegin({ user }) {
	const { term } = user.search;
	const result = search(user);

	// found something!
	if (result) {
		nextStep(user, STEP_SEARCH);
		return {
			text: `Про «${term}» кое-что есть:\n\n${result}`,
			buttons: [{
				title: 'Еще!',
				hide: true,
				payload: {
					value: PAYLOAD_MORE
				}
			}]
		};
	}

	// result not ready yet
	if (user.search.term) {
		return waitText();
	}

	// found nothing
	nextStep(user, STEP_UNKNOWN);
	return {
		text: `К сожалению ничего про «${term}» не нашлось. Попробуй выбрать что-то другое или просто скажи «Давай лучшее»`
	};
}

const waitTetxtList = [
	'Извините, наш сисадмин отошел за кофе, скоро он вернется и все для вас найдет! Лад+ы?',
	'Наш искусственный интеллект старается изо всех сил, немножко искр+ит - - даже, но скоро все найдет! Ок?',
	'Так, так, так..., где же это было... сейчас поищу... Ага, вот оно, закатилось под шкаф! Показать?'
];

function waitText() {
	const text = waitTetxtList[Math.floor(Math.random() * waitTetxtList.length)];
	const tts = text
		.replace(/\+/g, '')
		.replace(/ -/g, '')
	;

	return { text, tts };
}