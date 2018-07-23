const dashbot = require('dashbot');

module.exports = { init, incoming, outgoing };


let service;

function init() {
	const apiKey = process.env.DASHBOT_API_KEY;
	if (!apiKey) {
		console.log('no api-key for dashbot, continue without metrics');
		return;
	}

	const api = dashbot(apiKey);
	if (!api || !api.generic) {
		console.log('can\'t init dashbot api, continue without metrics');
		return;
	}

	service = api.generic;
	console.log('successfully init dashbot api, metrics on');
}

function incoming(data) {
	if (!service) {
		return;
	}

	const { request, session } = data;
	const { user_id } = session;
	const { payload, command } = request;

	let msg = {
		text: command,
		userId: user_id
	};

	if (payload && payload.value) {
		msg.postback = {
			buttonClick: {
				buttonId: payload.value
			}
		};
	}

	service.logIncoming(msg);
}

function outgoing(data) {
	if (!service) {
		return;
	}

	const { response, session } = data;
	const { text, buttons } = response;
	const { user_id } = session;

	let msg = {
		text,
		userId: user_id
	};

	if (buttons) {
		msg.buttons = buttons.map(button => ({
			id: button.payload.value,
			label: button.title,
			value: ''
		}));
	}

	service.logOutgoing(msg);
}