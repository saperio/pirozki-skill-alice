const provider = require('./provider');
const store = require('./store');
const {
	DB_USERS,
	STEP_NEW_USER,
	STEP_NAME,
	STEP_SECOND,
	STEP_COMEBACK,
	PAYLOAD_MORE,
	PAYLOAD_TWO_IN_ROW,
	PAYLOAD_THREE_IN_ROW
} = require('./constants');

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

function checkPayload(payload, checkValue) {
	if (!payload) {
		return false;
	}

	return payload.value === checkValue;
}

//user.inRow = 2;

module.exports = {
	[STEP_NEW_USER]: ({ user }) => {
		user.step = STEP_NAME;
		return 'Привет! Я читаю стишки пирожки, меня зовут Абырвалг, а тебя как?';
	},

	[STEP_NAME]: async ({ command, user }) => {
		user.step = STEP_SECOND;

		const button = {
			title: 'Еще еще!!!',
			hide: true,
			payload: {
				value: PAYLOAD_MORE
			}
		};

		// reject
		if (command.indexOf('не ') !== -1 || command.indexOf('нет ') !== -1 || command === 'нет') {
			const pieIdx = getRandomPieIdx(user);
			const { text } = await provider.best(pieIdx);

			return {
				text: `Ладно, вот тебе первый пирожок!\n${text}\n\nЕще?`,
				buttons: [button]
			};
		}

		// cleanup name
		const name = command
			.replace('а', '')
			.replace('меня', '')
			.replace('зовут', '')
			.trim()
		;

		user.name = name;

		const pies = await provider.search(name);
		if (pies.length) {
			return {
				text: `${pies[0].text}\n\nЕще?`,
				buttons: [button]
			};
		}

		const pieIdx = getRandomPieIdx(user);
		const { text } = await provider.best(pieIdx);

		return {
			text: `${text}\n\nЕще?`,
			buttons: [button]
		};
	},

	[STEP_SECOND]: async ({ payload, command, user }) => {
		// reject
		if (
			command.indexOf('хватит') !== -1,
			command.indexOf('стоп') !== -1,
			command.indexOf('достаточно') !== -1
		) {
			return {
				text: 'До встречи, приходи еще!',
				end_session: true
			}
		}

		if (checkPayload(payload, PAYLOAD_MORE)) {
		}

		const pieIdx = getRandomPieIdx(user);
		const { text } = await provider.best(pieIdx);

		return {
			text: `${text}\n\nА еще я могу читать по два и по три пирожка за раз, просто скажи «Давай по два»`,
			buttons: [
				{
					title: 'Давай по два',
					hide: true,
					payload: {
						value: PAYLOAD_TWO_IN_ROW
					}
				},
				{
					title: 'Давай по три',
					hide: true,
					payload: {
						value: PAYLOAD_THREE_IN_ROW
					}
				}
			]
		};
	},

	[STEP_COMEBACK]: async ({ command, user }) => {
	}
};