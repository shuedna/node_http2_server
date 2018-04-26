const os = require('os');
const eventEmitter = require('events');

module.exports = new eventEmitter();

function run (stream,headers,data) {
	var ints = os.networkInterfaces();
	data.content.data = {};
	data.content.data.hostname = os.hostname();
	data.content.data.memoryfree = os.freemem();
	data.content.data.uptime = "uptimeCal()"
	module.exports.emit('done',stream,headers,data);
}

function uptimeCal () {
	var sec = os.uptime()
	var day = Math.floor(sec / 86400)
	var hours = Math.floor((sec - (day * 86400)) / 3600)
	var mins = Math.floor(((sec - (day * 86400)) - (hours * 3600)) /60)
	var secs = Math.floor((((sec - (day * 86400)) - (hours * 3600)) - (mins * 60)))
	return(`${day} days ${hours}hours ${mins}mins${secs}secs`)
}

module.exports.run = run;

