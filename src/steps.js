const { DB_USERS, STEP_NEW_USER, STEP_NAME, STEP_SECOND } = require('./constants');
const provider = require('./provider');
const store = require('./store');

function updateUser(user, data) {
	store.update(DB_USERS, user.id, data);
}

function getRandomPieIdx(user) {
	let { bestContext } = user;
	if (!bestContext) {
		bestContext = {
			page: -1,
			idxList: []
		};
	}

	let { page, idxList } = bestContext;
	if (!idxList.length) {
		++page;
		idxList = Array.from({length: 10}, (_, i) => i);
	}

	const pieIdx = idxList.splice(Math.random() * idxList.length, 1)[0];
	user.bestContext = { page, idxList };

	return pieIdx;
}

module.exports = {
	[STEP_NEW_USER]: ({ user }) => {
		user.step = STEP_NAME;
		return 'Привет! Я читаю стишки пирожки, меня зовут Абырвалг, а тебя как?';
	},

	[STEP_NAME]: async ({ command, user }) => {
		// reject
		if (command.indexOf('не ') !== -1 || command.indexOf('нет ') !== -1 || command === 'нет') {
			user.step = STEP_SECOND;

			const pieIdx = getRandomPieIdx(user);
			const { text } = await provider.best(pieIdx);

			return `Ладно, вот тебе первый пирожок!\n${text}`;
		}

		// cleanup name
		const name = command
			.replace('а', '')
			.replace('меня', '')
			.replace('зовут', '')
			.trim()
		;

		user.step = STEP_SECOND;
		user.name = name;

		const pies = await provider.search(name);
		if (pies.length) {
			return pies[0].text;
		}

		const pieIdx = getRandomPieIdx(user);
		const { text } = await provider.best(pieIdx);

		return text;
	},

	[STEP_SECOND]: async ({ command, user }) => {

	}
};