var Twit = require('twit');
var config = require('./config.json');

var tweets = require(config.tweet_file);
var parking_lots = require(config.parking_file);

var events = require('events');
var eventEmitter = new events.EventEmitter();

var parkingBot = new Twit({
	consumer_key: config.consumer_key,
	consumer_secret: config.consumer_secret,
	access_token: config.access_token,
	access_token_secret: config.access_token_secret,
});

/*---*/

module.exports = {
	parking: parking
};

eventEmitter.on('ticket', function(array) {
	var tweet_prototype = "Ticketed parking info - " + formatDate() + '\n';

	if (array.length == parking_lots.ticket_before_four.length) {
		eventEmitter.emit('data_tweet', tweet_prototype, array, parking_lots.ticket_before_four);
	} else {
		eventEmitter.emit('data_tweet', tweet_prototype, array, parking_lots.ticket_after_four);
	}
});

eventEmitter.on('send_tweet', function (tweet) {
	parkingBot.post('statuses/update', { status: tweet}, function(err, data, response) {
		if (err) {
			console.log(err);
		} else { console.log(data); }
	});
});

eventEmitter.on('data_tweet', function(tweet, parking_data, parking_lot_name) {
	for (i in parking_data) {
		tweet = tweet + parking_lot_name[i] + ": " + parking_data[i] + "\n"
	}
	eventEmitter.emit('send_tweet', tweet);
});

eventEmitter.on('angry_tweet', function(type, data) {
	var total = 0;
	for (var i=0; i < data.length; i++) { total += data[i] };
	if (total < 50) {
		var tweet = formatDate() + ": "
		switch (type) {
			case "ticket":
				tweet = tweet + randomTweet(tweets.ticket)
				break
			case "permit":
				tweet =  tweet + randomTweet(tweets.permit)
				break
			case "carpool":
				tweet =  tweet + randomTweet(tweets.carpool)
				break
		}
	}
		//tweet = tweet + " " + config.hashtag;
		eventEmitter.emit('send_tweet', tweet);
});

/*---*/

function randomTweet(array) {
	var i = Math.floor(Math.random() * array.length);
	return array[i];
}

function formatDate() {
	value = new Date;
	return value.getDate() + "/" +  value.getMonth()+1 + " " 
		+ value.getHours() + ":" + value.getMinutes();
}

function parking(type, data) {
	switch (type) {
		case "ticket":
			eventEmitter.emit('ticket', data);
			break
		case "permit":
			eventEmitter.emit('data_tweet', "Permit parking info - " 
					+ formatDate() + '\n', data, parking_lots.permit);
			break
		case "carpool":
			eventEmitter.emit('data_tweet', "Carpool parking info - " 
					+ formatDate() + '\n', data, parking_lots.carpool);
			break
	}
	eventEmitter.emit('angry_tweet', type, data);
}
