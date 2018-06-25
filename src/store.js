const fs = require('fs').promises;

module.exports = { init, set, get, update };


let memory = {};
let dirty = false;
const dbFilename = './store.db';

async function init() {
	/*try {
		const raw = await fs.readFile(dbFilename);
		memory = JSON.parse(raw);
	} catch(e) {
		dirty = true;
	}

	await check();*/
}

function set(db, id, val) {
	if (!memory[db]) {
		memory[db] = {};
	}

	memory[db][id] = val;
	dirty = true;
}

function get(db, id) {
	if (!memory[db]) {
		return null;
	}

	if (!memory[db][id]) {
		return null;
	}

	return memory[db][id];
}

function update(db, id, val) {
	if (!memory[db]) {
		memory[db] = {};
	}

	if (!memory[db][id]) {
		memory[db][id] = {};
	}

	set(db, id, { ...memory[db][id], ...val});
}

// internal api
async function save() {
	await fs.writeFile(dbFilename, JSON.stringify(memory));
}

async function check() {
	if (dirty) {
		await save();
		dirty = false;
	}

	setTimeout(check, 1000);
}