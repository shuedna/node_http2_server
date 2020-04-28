const os = require('os');
const eventEmitter = require('events');

module.exports = new eventEmitter();

function run (req,res,page,app) {
	var ints = os.networkInterfaces();
	page.data = {};
	page.data.hostname = os.hostname();
	page.data.memoryfree = os.freemem();
	page.data.uptime =uptimeCal()
	console.log("script2")
	module.exports.emit('done',req,res,page);
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

