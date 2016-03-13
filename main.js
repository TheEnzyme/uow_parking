var uowAPI = require('./api.js');
var twitterBot = require ('./twitter.js');

var events = require('events');
var eventEmitter = new events.EventEmitter();

/*---*/

eventEmitter.on('ping', function(type, callback) {
	uowAPI.pull(type, callback);
});

eventEmitter.on('ticket_data', function(data) {
	eventEmitter.emit('tweet_ticket', data);
	eventEmitter.emit('log', data); 
});

eventEmitter.on('carpool_data', function(data) {
	eventEmitter.emit('tweet_carpool', data);
	eventEmitter.emit('log', data); 
});


eventEmitter.on('tweet_ticket', function(data) {
	twitterBot.ticket_parking(data);
});

eventEmitter.on('tweet_carpool', function(data) {
	twitterBot.carpool_parking(data);
});

function recieve(type, response) {
	switch (type) {
		case "ticket":
			eventEmitter.emit('ticket_data', response);
			break
		case "permit":
			eventEmitter.emit('permit_data', response);
			break
		case "carpool":
			eventEmitter.emit('carpool_data', response);
			break
		case "raw":
			//no need for raw here
			break
	}
}

/*---*/

var minutes = 5;
var interval = minutes * 60 * 1000;

/*setInterval(function() {
	// Hit the API
	console.log("doing stuff");
	eventEmitter.emit('ping');
}, interval); */

eventEmitter.emit('ping', 'all', recieve)
