
module.exports = { init, set, get };


let memory = {};

async function init() {
}

function set(db, id, val) {
	if (!memory[db]) {
		memory[db] = {};
	}

	memory[db][id] = val;
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