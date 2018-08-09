const fetch = require('node-fetch');
const { PAYLOAD_MORE, PAYLOAD_TWO_IN_ROW, PAYLOAD_THREE_IN_ROW } = require('./constants');


module.exports = { init, incoming, outgoing };

let apiKey;

function init() {
	apiKey = process.env.BOTANALYTICS_API_KEY;
	if (!apiKey) {
		console.log('no api-key for botanalytics, continue without metrics');
		return;
	}

	console.log('successfully init botanalytics api, metrics on');
}

function incoming(user, data) {
	if (!apiKey) {
		return;
	}

	const { payload, command } = data.request;

	let res;
	if (payload && payload.value) {
		switch (payload.value) {
			case PAYLOAD_MORE:
				res = '[PAYLOAD_MORE]';
				break;

			case PAYLOAD_TWO_IN_ROW:
				res = '[PAYLOAD_TWO_IN_ROW]';
				break;

			case PAYLOAD_THREE_IN_ROW:
				res = '[PAYLOAD_THREE_IN_ROW]';
				break;

			default:
				res = '[UNKNOWN_PAYLOAD]';
		}
	} else if (command) {
		res = command;
	} else {
		res = '<<empty>>'
	}

	send(user, res, false);
}

function outgoing(user, data) {
	if (!apiKey) {
		return;
	}

	const { text, buttons } = data.response;

	let res = text;
	if (buttons) {
		res += '\n' + buttons.map(button => `[${button.title}]`).join('');
	}

	send(user, res, true);
}

function send(user, text, is_sender_bot) {
	const { id, name } = user;
	const body = {
		is_sender_bot,
		user: {
			id,
			name: name || 'UNKNOWN'
		},
		message: {
			timestamp: Date.now(),
			text
		}
	};

	fetch(
		'https://api.botanalytics.co/v1/messages/generic/',
		{
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Token ${apiKey}`
			}
		}
	);
}