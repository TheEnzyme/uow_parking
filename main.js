var uowAPI = require('./api.js');
var twitterBot = require ('./twitter.js');

var events = require('events');
var eventEmitter = new events.EventEmitter();

/*---*/

eventEmitter.on('ping', function(type, callback) {
	uowAPI.pull(type, callback);
});

eventEmitter.on('tweet', function(type, data) {
	twitterBot.parking(type, data);
});

eventEmitter.on('log', function(type, data) {
	console.log('todo');
});

function recieve(type, response) {
	eventEmitter.emit('tweet', type, response);
	eventEmitter.emit('log', type, response);
}

/*---*/

var minutes = 15;
var interval = minutes * 60 * 1000;

setInterval(function() {
	var time = new Date();
	if (time.getHours() < 19 && time.getHours() >= 7) {
		console.log("Initial ping");
		eventEmitter.emit('ping', 'all', recieve);
	} else {
		console.log("After 7pm and before 7am");
	}
}, interval);

console.log("starting up!");
