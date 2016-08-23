var tweet = require('./twitter');

var flatten = require('lodash').flatten;
var Client = require('node-rest-client').Client;
var uowAPI = new Client();
var parkingBot = require('./parkingBot')

/*---*/

var mentionStream = parkingBot.stream('user', { track: [ "UOWParking status" ] });

mentionStream.on('tweet', tweet => {
    // get user, check which categories they want to check
})

/*---*/

function pull(category, callback) {
    uowAPI.get("https://api.uow.edu.au/parking/data/?array", (dataArray, response) => {
        dataArray = flatten(dataArray.map(data => {
            data.zones.forEach(zone => { zone.id = data.id });
            data.zones = data.zones.filter(zone => zone.status != "after 4pm");
            return data.zones.map(zone => ({
                parks: zone.parks,
                total: zone.total,
                type: zone.type,
                id: zone.id
            }))
        }));

        callback({
            ticket:  dataArray.filter(data => data.type === "ticket"),
            carpool: dataArray.filter(data => data.type === "carpool"),
            permit:  dataArray.filter(data => data.type === "permit")
        })
    })
}

/*---*/

function log(data) {
    // to be replaced with putting the data into a database
    console.log("Logging: ", data);
}

function setTimer() {
    let interval = 60 * 60 * 1000;

    setInterval(() => {
        var time = new Date();
        if (time.getHours() <= 19 && time.getHours() >= 7) {
            console.log("Pinging API");
            pull(data => {
                log(data);
                tweet(data);
            })
        }
    }, interval)
}

// Start Twitter bot
console.log("starting up!");
pull('all', log);
//setTimer();
