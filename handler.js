const capitalize = require("lodash/fp/capitalize");
const chunk = require("lodash/fp/chunk");
const compose = require("lodash/fp/compose");
const flatMap = require("lodash/fp/flatMap");
const groupBy = require("lodash/fp/groupBy");
const has = require("lodash/fp/has");
const join = require("lodash/fp/join");
const map = require("lodash/fp/map");
const mapValues = require("lodash/fp/mapValues");
const padCharsStart = require("lodash/fp/padCharsStart");
const reduce = require("lodash/fp/reduce");

const Twit = require('twit');
const { promisify } = require('util')
const request = require('request');
const request_promise = promisify(request);

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

const chunkTextForTwitter = compose(map(join('')), chunk(280));

const to12HourTime = hours => hours % 12 || 12;
const formatHours = compose(to12HourTime, time => time.getHours());
const formatMinutes = compose(padCharsStart('0', 2), time => time.getMinutes());

const formatCurrentTime = (time) => formatHours(time) + ':' + formatMinutes(time);
const prependTime = text => formatCurrentTime(new Date) + text;

const groupToTweet = (tweet, lotCounts, parkingType) => `${tweet}

${parkingType}:
${lotCounts}`;

const zoneToTweet = ({ id, status, parks, total }) => (status === "open")
    ? `${id}: ${parks > 0 ? parks : 'Full'}`
    : `${id}: Closed`;
const groupValToText = compose(join('\n'), map(zoneToTweet));

const uncappedReduce = reduce.convert({ 'cap': false });

const constructTweets = compose(
    chunkTextForTwitter,
    prependTime,
    uncappedReduce(groupToTweet, ''),
    mapValues(groupValToText),
);

const addIdToZone = id => zone => ({ ...zone, id });
const mapToZones = ({ zones, id }) => map(addIdToZone(id), zones);

const groupParkingLots = compose(
    groupBy(zone => capitalize(zone.type)),
    flatMap(mapToZones),
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

exports.bot = (event, context, cb) => {
    getParkingData()
        .then(groupParkingLots)
        .then(constructTweets)
        .then(map(sendTweet))
        .then(x => cb(null, x))
}
