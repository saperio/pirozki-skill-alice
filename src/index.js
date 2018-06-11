const server = require('./server');
const store = require('./store');
const provider = require('./provider');


async function run() {
	await store.init();
	await provider.init();

	server(async req => {
		return {
			'hello': 'world'
		};
	});
}

run();