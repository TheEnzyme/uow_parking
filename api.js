var jsonQuery = require('json-query');
var Client = require('node-rest-client').Client;

var uowAPI = new Client();

var events = require('events');
var eventEmitter = new events.EventEmitter();
 
/*---*/

module.exports = {
	pull: pullData,
};

/*---*/

eventEmitter.on('ticket', function(data, callback) {
	callback('ticket', jsonQuery('[*type=ticket].parks', {data: data }).value)
});

eventEmitter.on('permit', function(data, callback) {
	callback('permit', jsonQuery('[*type=permit].parks', {data: data }).value)
});

eventEmitter.on('carpool', function(data, callback) {
	callback('carpool', jsonQuery('[*type=carpool].parks', {data: data }).value)
});

/*---*/

function pullData(type,callback) {
	uowAPI.get("https://api.uow.edu.au/parking/data/?array", 
	function(data, response) {
		switch (type) {
			case "all":
				eventEmitter.emit('ticket', data, callback);
				eventEmitter.emit('permit', data, callback);
				eventEmitter.emit('carpool', data, callback);
				break
			case "ticket":
				data = getOpen(data);
				eventEmitter.emit('ticket', data, callback);
				break
			case "permit":
				data = getOpen(data);
				eventEmitter.emit('permit', data, callback);
				break
			case "carpool":
				data = getOpen(data);
				eventEmitter.emit('carpool', data, callback);
				break
			case "raw":
					callback('raw', data.value);
		}
	})
}

function getOpen(data) {
	data = jsonQuery('zones[*status!~/after/i]', { data: data, allowRegexp: true }).value;
	return data;
}
