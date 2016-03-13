var Twit = require('twit');
var config = require('./config.json');
var tweets = require(config.tweet_file);

function formatDate(value) {
   return value.getDate() + "/" +  value.getMonth()+1 + " " + value.getHours() + ":" + value.getMinutes();
}

module.exports = {
	ticket_parking: ticket_parking,
	carpool_parking: carpool_parking
};


var parkingBot = new Twit({
	consumer_key: config.consumer_key,
	consumer_secret: config.consumer_secret,
	access_token: config.access_token,
	access_token_secret: config.access_token_secret,
});

function ticket_parking(array) {
	var i = Math.floor(Math.random() * tweets.ticket.length);
	var tweet = tweets.ticket[i];
	var date = formatDate(new Date);
	console.log(date);

	parkingBot.post('statuses/update', { status: date+": "+tweet}, function(err, data, response) {
		if (err) {
			console.log(err);
			ticket_parking(array);
		} else { console.log(data); }
	});
}

function carpool_parking(array) {
	var i = Math.floor(Math.random() * tweets.ticket.length);
	var tweet = tweets.carpool[i];
	var date = formatDate(new Date);
	console.log(date);

	parkingBot.post('statuses/update', { status: date+": "+tweet}, function(err, data, response) {
		if (err) {
			console.log(err);
			ticket_parking(array);
		} else { console.log(data); }
	});
}
