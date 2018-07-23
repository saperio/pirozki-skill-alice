const server = require('./server');
const store = require('./store');
const steps = require('./steps');
const { DB_USERS, STEP_COMEBACK, STEP_UNKNOWN } = require('./constants');
const { createUser } = require('./utils');
const metrics = require('./metrics');


(async () => {
	await store.init();
	metrics.init();

	if (process.argv[2] === '--pirocli') {
		const cli = require('./cli');
		cli(handler);
		return;
	}

	server(handler);
})();

async function handler(req) {
	const { request, session, version } = req;
	const { user_id } = session;
	const { payload } = request;
	const command = request.command ? request.command.toLowerCase() : '';

	metrics.incoming(req);

	let user = await store.get(DB_USERS, user_id);
	if (!user) {
		user = createUser(user_id);
	} else if (session.new) {
		user.step = STEP_COMEBACK;
	}
	user.requestIdx++;

	let response;
	try {
		response = await steps({ command, user, payload });
	} catch(e) {
		console.log(`Something goes wrong with user ${user_id}:\n${e}`);

		user.step = STEP_UNKNOWN;
		response = {
			text: 'Ой, что-то пошло не так! Я попробую сначала?'
		}
	}

	store.set(DB_USERS, user_id, user);

	const result = {
		response: {
			end_session: false,
			...response
		},
		session,
		version
	};

	metrics.outgoing(result);

	return result;
}