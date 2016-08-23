var Twit = require('twit');
var config = require('./config.json');
var parkingBot = require('./parkingBot');

var angryTweets = require(config.tweet_file);

/*---*/

//exports.tweet = tweet;

/*---*/

function randomTweet(array) {
    var i = Math.floor(Math.random() * array.length);
    return array[i];
}

function formatDate() {
    value = new Date;
    var minutes = value.getMinutes();
    if (minutes < 10) {
        minutes = "0"+minutes;
    }

    return value.getDate() + "/" + (value.getMonth() + 1) + " "
        + value.getHours() + ":" + minutes;
}

function format(data) {
    return data.id + ": " + data.parks + "\n";
}

function sendTweet(tweet) {
    parkingBot.post('statuses/update', { status: tweet }, (err, data, response) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Successful tweet!");
        }
    });
}

export default function tweet(categories, data) {
    {ticket, carpool, permit} = data;
    // need to rewrite to reduce to total
    if (ticket.parks.reduce((prev, curr) => prev + curr)  < config.angry_threshold ||
        carpool.parks.reduce((prev, curr) => prev + curr)  < config.angry_threshold ||
        permit.parks.reduce((prev, curr) => prev + curr)  < config.angry_threshold ||
    ) {
        sendTweet(formatDate() + ": " + randomTweet(angryTweets) + config.hashtag);
    }

    switch (categories) {
    }
    // this also needs to become a reduce
    
    data.map(category => format).then(formattedData => {
        sendTweet(formatDate() + ":\n" + formattedData);
    })
}
