var Twit = require('twit');
var config = require('./config.json');

var angryTweets = require(config.tweet_file);

var parkingBot = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token: config.access_token,
    access_token_secret: config.access_token_secret,
});

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
    })
}

export default function tweet(data) {
    if (data.ticket.parks  < config.angry_threshold ||
        data.permit.parks  < config.angry_threshold ||
        data.carpool.parks < config.angry_threshold
    ) {
        sendTweet(formatDate() + ": " + randomTweet(angryTweets));
    }

    data.map(category => format).then(formattedData => {
        sendTweet(formatDate() + ":\n" + formattedData);
    })
}
