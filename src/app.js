import fp from "lodash/fp"
import Twit from 'twit';
import request from 'request-promise';

import config from './config.json';

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

const parkingBot = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token: config.access_token,
    access_token_secret: config.access_token_secret,
});


const chunkTextForTwitter = fp.compose(fp.map(fp.join('')), fp.chunk(280))

const formatMinutes = fp.compose(
    (min) => (min < 10) ? `0${min}` : min,
    time => time.getMinutes()
)

const formatCurrentDate = (time) => `${time.getHours()}:${formatMinutes(time)}`;
const prependTime = text => `${formatCurrentDate(new Date)}${text}`

const groupToTweet = (text, val, key) => `${text}\n\n${fp.capitalize(key)}:\n${val}`

const zoneToTweet = ({ id, status, parks, total }) => (status === "open")
    ? `${id}: ${parks > 0 ? parks : 'Full'}`
    : `${id}: Closed`

const groupValToText = fp.compose(fp.join('\n'), fp.map(zoneToTweet))

const addIdToZone = id => zone => ({ ...zone, id })
const mapZoneToZones = ({ zones, id }) => fp.map(addIdToZone(id), zones)

const uncappedReduce = fp.reduce.convert({ 'cap': false })

const constructTweets = fp.compose(
    chunkTextForTwitter,
    prependTime,
    uncappedReduce(groupToTweet, ''),
    fp.mapValues(groupValToText),
    fp.groupBy(zone => zone.type),
    fp.flatMap(mapZoneToZones),
    JSON.parse, // can fail
)

const getParkingData = () => request('https://api.uow.edu.au/parking/data?array')

const successFn = result => (fp.has('data.errors', result))
    ? Promise.reject(result.data.errors)
    : console.log('Success!')

const sendTweet = (status) => parkingBot.post('statuses/update', { status })
    .then(successFn)
    .catch(console.log)

function main() {
    return getParkingData()
        .then(constructTweets)
        .then(fp.map(sendTweet))
}

main()
