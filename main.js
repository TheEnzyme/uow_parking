var tweet = require('./twitter');

var Client = require('node-rest-client').Client;
var uowAPI = new Client();

/*---*/

function pull(type) {
    return Promise.resolve(
        uowAPI.get("https://api.uow.edu.au/parking/data/?array")
        .then( (dataArray, response) => {
            dataArray.filter(); // filter to parking lots that are open
            dataArray = dataArray.map(data => ({ // make the data an array of id's, type and spots
                id: data.id,
                type: data.type,
                spots: data.parks
            }))
            .then({
                // not sure if correct
                var ticket = dataArray.filter(data.type == 'ticket');
                var carpool = dataArray.filter(data.type == 'carpool');
                var permit = dataArray.filter(data.type == 'permit');

                return {
                    ticket,
                    carpool,
                    permit
                };
            });
        });
    );
}

/*---*/

function log(data) {
    // to be replaced with putting the data into a database
    console.log("Logging: ", data);
}

function handle(data) {
    tweet(data);
    log(data);
}

function ping() {
    pull().then(results => {
        handle(results);
    });
}

function setTimer() {
    let interval = 60 * 60 * 1000;

    setInterval(() => {
        var time = new Date();
        if (time.getHours() <= 19 && time.getHours() >= 7) {
            console.log("Pinging API");
            handle(ping());
        }
    }, interval)
}

// Start Twitter bot
console.log("starting up!");
setTimer();
