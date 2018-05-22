const os = require('os');
const eventEmitter = require('events');

module.exports = new eventEmitter();

function run (req,res,page,app) {
	var ints = os.networkInterfaces();
	page.data.hostname = "<p>"+os.hostname()+"</p>";
	page.data.memory = "<p>"+ Math.floor(os.freemem()/ 1048576)  +"MB Ram Free / " + Math.floor(os.totalmem()/1048576) + "MB Total</p>"
	page.data.uptime = "<p>Server Up time " + uptimeCal()+"</p>"
	page.data.appMemUsage = process.memoryUsage().rss 
	page.data.ipAddresses = '';
	for (var int in ints) {
		if (int != 'lo') {
			for (var i = 0; i < ints[int].length; i++) {
				page.data.ipAddresses += `<p> IP address : ${ints[int][i].address}</p>`;
			}
		}
	}
	console.log("test script")
	app.test = "test" 
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

