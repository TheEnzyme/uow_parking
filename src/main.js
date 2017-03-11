import _ from 'lodash';
import Twit from 'twit';
import request from 'request-promise';

import config from './config.json';

const parkingBot = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token: config.access_token,
    access_token_secret: config.access_token_secret,
});


function getOpenTypeOfParking(parkingLots, type) {
    return _.reduce(parkingLots, (acc, lotData, lotName) => {
        const status = _.get(lotData, `zones.${type}.status`, '')

        if (status && status === 'open') {
            const finalLotData = _.get(lotData, `zones.${type}`)
            return _.concat(acc, [{ lotName, ...finalLotData }]);
        }

        return acc;
    }, []);
}

function findTypesOfParking(parkingLots) {
    return _.reduce(parkingLots, (acc, lotData, lotName) => {
        const types = _.keys(lotData.zones);
        return _.union(acc, types);
    }, [])
}

function getParkingData() {
    return request('https://api.uow.edu.au/parking/data')
        .then(data => JSON.parse(data))
        .then(data => {
            const types = findTypesOfParking(data);

            return _.reduce(types, (acc, type) => {
                return Object.assign(
                    {},
                    acc,
                    { [type]: getOpenTypeOfParking(data, type) }
                )
            }, {})
        });
}

function parkingLotToString(parkingLot) {
    const tweet = `${parkingLot.lotName} ${parkingLot.parks}`
    return tweet;
}

function formatMinutes(minuteValue) {
    if (minuteValue < 10) {
        return "0" + minuteValue;
    }

    return minuteValue;
}

function formatCurrentDate() {
    const time = new Date;
    return time.getHours() + ":" + formatMinutes(time.getMinutes());
}

function inUniHours() {
    const time = new Date();
    return (time.getHours() <= 19 && time.getHours() >= 7)
}

function sendTweet(status) {
    return parkingBot.post('statuses/update', { status })
        .then(result => {
            if (_.get(result, 'data.errors', '')) {
                return Promise.reject(result.data.errors);
            }

            console.log ('Successful tweet');
        })
        .catch(err => {
            console.log('Error:', err);
        })
}

function log(data) {
    // to be replaced with putting the data into a database
    console.log("Logging: ", data);
}

function setTimer(interval, fn) {
    setInterval(
        () => {
            if (inUniTimes()) {
                fn()
            }
        },
        interval * 60 * 1000 // pass in minutes, converted to milliseconds
    );
}

function main() {
    return getParkingData()
        .then(sortedParking => {
            const tweetBody = _.map(
                sortedParking,
                (data, name) => {
                    const tweets = data.map(value => parkingLotToString(value));
                    return `${name.toUpperCase()}:\n` + tweets.join('\n');
                }
            )
            .join('\n\n');

            return `${formatCurrentDate()}\n\n${tweetBody}`;
        })
        .then(tweet => sendTweet(tweet));
}

if (inUniTimes) {
    main()
}
