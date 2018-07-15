const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});


module.exports = function cli(handler) {
	ask('Hi!', handler, true);
}

function ask(respText, handler, newSession = false) {
	rl.question(`${respText}\n`, async answer => {
		const resp = await handler({
			meta: {
				locale: 'ru-RU',
				timezone: 'Europe/Moscow',
				client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)'
			},
			request: {
				command: answer,
				original_utterance: answer,
				type: 'SimpleUtterance',
				markup: {
					dangerous_context: false
				},
				payload: {}
			},
			session: {
				new: newSession,
				message_id: 4,
				session_id: '2eac4854-fce721f3-b845abba-20d60',
				skill_id: '3ad36498-f5rd-4079-a14b-788652932056',
				user_id: 'AC9WC3DF6FCE052E45A4566A48E6B7193774B84814CE49A922E163B8B29881DC'
			},
			version: '1.0'
		});

		let { text, buttons } = resp.response;
		if (buttons && buttons.length) {
			const buttonsText = buttons.map(button => `[${button.title}]`).join(' ');
			text += `\n${buttonsText}`;
		}

		ask(`--------------${text}--------------`, handler);
	});
}