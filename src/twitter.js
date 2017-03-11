var Twit = require('twit');
// var config = require('./config.json');
var parkingBot = require('./parkingBot');
var _ = require('lodash');

var angryTweets = require(config.tweet_file);


function randomTweet(array) {
    var i = Math.floor(Math.random() * array.length);
    return array[i];
}

function sendTweet(tweet) {
    return parkingBot.post('statuses/update', { status: tweet })
        .then(() => {
            if (_.get(result, 'data.errors', '')) {
                return Promise.reject(result.data.errors);
            }

            console.log ('Successful tweet');
        })
        .catch(err => {
            console.log('Error:', err);
        })
}

export default function tweet(categories, data) {
    let { ticket, carpool, permit } = data;
    // need to rewrite to reduce to total
    if (ticket.parks.reduce((prev, curr) => prev + curr)  < config.angry_threshold ||
        carpool.parks.reduce((prev, curr) => prev + curr) < config.angry_threshold ||
        permit.parks.reduce((prev, curr) => prev + curr)  < config.angry_threshold
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
