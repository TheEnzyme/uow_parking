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

var tweetCount = { 'ticket': 0, 'permit': 0, 'carpool': 0 }
var tweetArray = [ "", "", "", "" ]

/*---*/

module.exports = {
	parking: parking
};

eventEmitter.on('ticket', function(array) {
	var tweet_prototype = "Ticket:\n";

	if (array.length == parking_lots.ticket_before_four.length) {
		eventEmitter.emit('data_tweet', 1, tweet_prototype, array, parking_lots.ticket_before_four);
	} else {
		eventEmitter.emit('data_tweet', 1, tweet_prototype, array, parking_lots.ticket_after_four);
	}
});

eventEmitter.on('send_tweet', function (tweet) {
	parkingBot.post('statuses/update', { status: tweet}, function(err, data, response) {
		if (err) {
			console.log(err);
		} else { console.log("Successful tweet!"); }
	});
});

eventEmitter.on('data_tweet', function(finalIndex, tweet, parking_data, parking_lot_name) {
	for (i in parking_data) {
		tweet = tweet + parking_lot_name[i] + ": " + parking_data[i] + "\n"
	}
	// modify global tweet array
	tweetArray[finalIndex] = tweet;
	eventEmitter.emit('check_send');
});

eventEmitter.on('check_send', function() {
	// if all array slots are full, emit send tweet
	var filled = 0
	for (i in tweetArray) {
		if (tweetArray[i] != "")
			filled += 1;
	}

	if (filled == tweetArray.length) {	
		var finalTweet = tweetArray.join('')
		eventEmitter.emit('send_tweet', finalTweet);
		for (i in tweetArray) {
			tweetArray[i] = "";
		}
	}
});

eventEmitter.on('angry_tweet', function(type, data) {
	// make sure angry tweets only happen once after it fills up.
	var total = 0;
	for (var i=0; i < data.length; i++) { total += data[i] };
		
	var tweet = formatDate() + ": "
	switch (type) {
		case "ticket":
			tweet = tweet + randomTweet(tweets.ticket)
			var tweet_count = tweetCount.ticket
			break
		case "permit":
			tweet =  tweet + randomTweet(tweets.permit)
			var tweet_count = tweetCount.permit
			break
		case "carpool":
			tweet =  tweet + randomTweet(tweets.carpool)
			var tweet_count = tweetCount.carpool
			break
	}

	if (total <= config.angry_threshold) {
	} else {
		// resets the number of tweets allowed to be sent
		// while under the threshold.
		tweet_count = 0;
	}

	if (tweet_count <= 3 && total < config.angry_threshold) {
		tweet = tweet + " " + config.hashtag;
		eventEmitter.emit('send_tweet', tweet);
		tweet_count += 1;
	}
});

/*---*/

function randomTweet(array) {
	var i = Math.floor(Math.random() * array.length);
	return array[i];
}

function formatDate() {
	value = new Date;
	var minutes = value.getMinutes();
	if (minutes < 10) { minutes = "0"+minutes; }
	return value.getDate() + "/" +  value.getMonth()+1 + " " 
		+ value.getHours() + ":" + minutes;;
}

function parking(type, data) {
	tweetArray[0] = formatDate() + "\n"
	switch (type) {
		case "ticket":
			eventEmitter.emit('ticket', data);
			break;
		case "permit":
			eventEmitter.emit('data_tweet', 2, "Permit:\n", data, parking_lots.permit);
			break;
		case "carpool":
			eventEmitter.emit('data_tweet', 3, "Carpool:\n", data, parking_lots.carpool);
			break;
	}
	eventEmitter.emit('angry_tweet', type, data);
}
