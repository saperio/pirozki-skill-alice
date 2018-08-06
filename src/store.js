const fs = require('fs');
const mongo = require('mongodb').MongoClient;
const { DB_USERS, DB_PIES_BEST, DB_PIES_SEARCH } = require('./constants');


module.exports = { init, set, get, getInstant };


let memory = {};
let db;
let dbQueue = [];

async function init() {
	// init collections
	memory[DB_USERS] = {};
	memory[DB_PIES_BEST] = {};
	memory[DB_PIES_SEARCH] = {};

	let url;
	try {
		const info = await loadDbInfo();
		url = info.url;
	} catch (e) {
		console.log('db info do not found, work with in-memory db only');
		return;
	}

	let client;
	try {
		client = await mongo.connect(url, { useNewUrlParser: true });
	} catch(e) {
		console.log(`can't connect to mongo db with error: ${e}\nwork with in-memory db only`);
		return;
	}

	db = client.db();
	console.log('successfully connected to mongo db');
}

async function loadDbInfo() {
	const url = process.env.PIR_MONGO_URL;
	if (url) {
		return { url };
	}

	return new Promise((resolve, reject) => {
		fs.readFile('./db.json', (err, raw) => {
			if (err) {
				reject();
				return;
			}

			resolve(JSON.parse(raw));
		});
	});
}

function updateQueue() {
	const val = dbQueue.shift();
	if (!val) {
		return;
	}

	db.collection(DB_USERS).findOneAndUpdate(
		{ _id: val._id },
		{ $set: val },
		{ upsert: true },
		err => {
			if (err) {
				console.error('db error on update: ', err);
			}

			updateQueue();
		}
	);
}

// do not save DB_PIES_SEARCH and DB_PIES_BEST databases to persistant db
function set(collection, id, val) {
	memory[collection][id] = val;

	if (collection !== DB_USERS || !db) {
		return;
	}

	let obj = {
		...val,
		_id: val.id
	};
	delete obj.id;

	dbQueue.push(obj);
	if (dbQueue.length === 1) {
		updateQueue()
	}
}

async function get(collection, id) {
	if (memory[collection][id]) {
		return memory[collection][id];
	}

	if (collection !== DB_USERS || !db) {
		return null;
	}

	let res;
	try {
		res = await db.collection(collection).findOne({ _id: id });
	} catch (e) {
		return null;
	}

	if (!res) {
		return null;
	}

	let converted = {
		...res,
		id: res._id
	};
	delete converted._id;

	return converted;
}

function getInstant(collection, id) {
	if (memory[collection][id]) {
		return memory[collection][id];
	}

	return null;
}