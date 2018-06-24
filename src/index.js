const server = require('./server');
const store = require('./store');
const provider = require('./provider');
const steps = require('./steps');
const { DB_USERS, STEP_COMEBACK } = require('./constants');
const { createUser } = require('./utils');


(async () => {
	await store.init();
	await provider.init();

	server(handler);
})();


async function handler(req) {
	const { request, session, version } = req;
	const { user_id } = session;
	const { payload } = request;
	const command = request.command.toLowerCase();

	let user = store.get(DB_USERS, user_id);
	if (!user) {
		user = createUser(user_id);
	} else if(session.new) {
		user.step = STEP_COMEBACK;
	}

	user.requestIdx++;

	let response = await steps({ command, user, payload });
	if (typeof response === 'string') {
		response = { text: response };
	}

	store.set(DB_USERS, user_id, user);

	return {
		response: {
			end_session: false,
			...response
		},
		session,
		version
	};
}