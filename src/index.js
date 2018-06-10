const server = require('./server');

server(async req => {
	return {
		'hello': 'world'
	};
});