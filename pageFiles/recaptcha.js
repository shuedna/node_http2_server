const request = require('request');
const eventEmitter = require('events');

module.exports = new eventEmitter();

function run (req,res,data,app) {
	//console.log(data)
	var recaptcha = {}
	recaptcha.uri = 'https://www.google.com/recaptcha/api/siteverify'
	recaptcha.method = 'POST'
	recaptcha.form = {
		'secret':'6Ld0ohUUAAAAAL2LlCxES6hagcjkMGNswugFm6Ah',
		'response':data.postData
	}
	request(recaptcha, function (error, response, replybody) {
		module.exports.emit('done',req,res,JSON.parse(replybody));
	})
}


module.exports.run = run;

