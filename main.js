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

eventEmitter.on('hourly_timer', function () {
	var interval = 60 * 60 * 1000;
	setInterval(function() {
		var time = new Date();
		if (time.getHours() <= 19 && time.getHours() >= 7) {
			console.log("Initial ping");
			eventEmitter.emit('ping', 'all', recieve);
		} else if (time.getHours() <= 7) {
			// unregister timer and set new one
			clearTimeout(this);
			eventEmitter.emit('quarterly_timer');
		}
	}, interval);
});


eventEmitter.on('quarterly_timer', function () {
	var interval = 15 * 60 * 1000;
	setInterval(function() {
		var time = new Date();
		if (time.getHours() < 9 && time.getHours() >= 7) {
			console.log("Initial ping");
			eventEmitter.emit('ping', 'all', recieve);
		} else if (time.getHours() >= 9) {
			// unregister timer and set new one
			clearTimeout(this);
			eventEmitter.emit('hourly_timer');
		}
	}, interval);
});

console.log("starting up!");
eventEmitter.emit('quarterly_timer');
