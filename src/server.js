const http = require('http');

module.exports = function server(handler) {
	const server = http.createServer((req, res) => {
		const { url, method } = req;

		if (method === 'POST' && url.indexOf('/skill') === 0) {
			const bodyChunks = [];
			req
				.on('error', err => console.error(err))
				.on('data', chunk => bodyChunks.push(chunk))
				.on('end', async () => {
					const bodyRaw = Buffer.concat(bodyChunks).toString();
					const body = JSON.parse(bodyRaw);

					const respBody = await handler(body);

					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(respBody));
				})
			;
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('Hello');
		}
	});

	server.listen(3000);
};
