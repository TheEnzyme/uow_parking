const capitalize = require("lodash/fp/capitalize");
const chunk = require("lodash/fp/chunk");
const compose = require("lodash/fp/compose");
const flatMap = require("lodash/fp/flatMap");
const groupBy = require("lodash/fp/groupBy");
const has = require("lodash/fp/has");
const join = require("lodash/fp/join");
const map = require("lodash/fp/map");
const mapValues = require("lodash/fp/mapValues");
const reduce = require("lodash/fp/reduce");

const Twit = require('twit');
const { promisify } = require('util')
const request = require('request');
const request_promise = promisify(request);

/*
    Response = [ZoneObj]

    Zone: {
        zones: [Status],
        id: string,
        name: string
    }

    Status: {
        status: string,
        updated: date_string
        name: string,
        parks: number,
        total: number,
        id: number
    }
*/

const {
    CONSUMER_KEY,
    CONSUMER_SECRET,
    ACCESS_TOKEN,
    ACCESS_SECRET
} = process.env

const parkingBot = new Twit({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token: ACCESS_TOKEN,
    access_token_secret: ACCESS_SECRET,
});

const chunkTextForTwitter = compose(map(join('')), chunk(280))

const formatMinutes = compose(
    (min) => (min < 10) ? `0${min}` : min,
    time => time.getMinutes()
)

const formatCurrentDate = (time) => time.getHours() + ':' + formatMinutes(time);
const prependTime = text => formatCurrentDate(new Date) + text;

const groupToTweet = (text, val, key) => `${text}\n\n${capitalize(key)}:\n${val}`

const zoneToTweet = ({ id, status, parks, total }) => (status === "open")
    ? `${id}: ${parks > 0 ? parks : 'Full'}`
    : `${id}: Closed`

const groupValToText = compose(join('\n'), map(zoneToTweet))

const addIdToZone = id => zone => ({ ...zone, id })
const mapZoneToZones = ({ zones, id }) => map(addIdToZone(id), zones)

const uncappedReduce = reduce.convert({ 'cap': false })

const constructTweets = compose(
    chunkTextForTwitter,
    prependTime,
    uncappedReduce(groupToTweet, ''),
    mapValues(groupValToText),
    groupBy(zone => zone.type),
    flatMap(mapZoneToZones),
    JSON.parse, // can fail
    resp => resp.body
)

const getParkingData = () => request_promise('https://api.uow.edu.au/parking/data?array')

const successFn = result => (has('data.errors', result))
    ? Promise.reject(result.data.errors)
    : console.log('Success!')

const sendTweet = (status) => parkingBot.post('statuses/update', { status })
    .then(successFn)
    .catch(console.log)

exports.bot = (event) => {
    return new Promise((resolve, reject) => {
        getParkingData()
            .then(constructTweets)
            .then(map(sendTweet))
            .then(resolve)
    })
}
