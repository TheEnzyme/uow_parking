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

var minutes = 10;
var interval = minutes * 60 * 1000;

setInterval(function() {
	// Hit the API
	console.log("Initial ping");
	eventEmitter.emit('ping', 'all', recieve)
}, interval);

