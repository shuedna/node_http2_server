const os = require('os');
const eventEmitter = require('events');

module.exports = new eventEmitter();

function run (stream,headers,data) {
	var ints = os.networkInterfaces();
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

module.exports.run = run;

