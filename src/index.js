const server = require('./server');
const store = require('./store');
const provider = require('./provider');
const { DB_USERS } = require('./constants');
const { createUser } = require('./utils');


(async () => {
	await store.init();
	await provider.init();

	server(handler);
})();


async function handler(req) {
	const { request, session } = req;
	const { user_id } = session;
	let user = store.get(DB_USERS, user_id);

	if (!user) {
		user = createUser(user_id);
	}

	const answer = await think(request, session, user);

	store.set(DB_USERS, user_id, user);
	return answer;
}

async function think(request, session, user) {
}
