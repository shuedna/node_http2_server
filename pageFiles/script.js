const os = require('os');
const eventEmitter = require('events');

module.exports = new eventEmitter();

function run (stream,headers,data) {
	var ints = os.networkInterfaces();
	data.content.data.hostname = "<p>"+os.hostname()+"</p>";
	data.content.data.memory = "<p>"+ Math.floor(os.freemem()/ 1048576)  +"MB Ram Free / " + Math.floor(os.totalmem()/1048576) + "MB Total</p>"
	data.content.data.uptime = "<p>Server Up time " + uptimeCal()+"</p>" 
	data.content.data.ipAddresses = '';
	for (var int in ints) {
		if (int != 'lo') {
			for (var i = 0; i < ints[int].length; i++) {
				data.content.data.ipAddresses += `<p> IP address : ${ints[int][i].address}</p>`;
			}
		}
	}
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

