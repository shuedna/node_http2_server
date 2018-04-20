"use strict";
const http2 = require('http2');
const http = require('http');
const fs = require('fs');
const mime = require('mime');
const nodemailer = require('nodemailer');

const config_path = "server-config.json";
var app = {};
var cache = {};
var mail = {};

(//Init - load config file
	function () {
		console.log(`loading ${config_path}...`)
		var data = ""; 
		try {
			var data = fs.readFileSync(config_path)
			app = (JSON.parse(data))
			console.log("Done")
			loadCerts()
			if (app.config.mail) {
				loadMailer()
			}
		}catch (err) {
			console.error(err)
		}			
  	}
)()


function loadCerts() {
	console.log ("loading Certs...")
	try {
		app.ssl = {};
		app.ssl.cert = fs.readFileSync(app.config.ssl.cert)
		app.ssl.key = fs.readFileSync(app.config.ssl.key) 
		console.log("Done")
		initSecureServer()
	}catch (err) {
		console.error(err)
	}
}

function initSecureServer () {
	console.log("loading Secure Server...")
	app.server = http2.createSecureServer({
		key : app.ssl.key,
		cert : app.ssl.cert
	})
	app.server.on('error', (err) => console.error(err));
	app.server.on('socketError', (err) => console.error(err));

	app.server.on('stream', (stream, headers) => {
		var postData='';
		stream.on('data',function (chunk) {
			postData=(postData += chunk)
			//console.log('a chunk')
		})

		stream.on('end', function () {
			if (headers[":method"] == "POST") {
				//console.log(postData)
				respond("text",200,postData)		
			}else if (headers[":path"].includes(".") == true) {
				//console.log(`File = ${headers[":path"]}`)
				getFile(app.site.path + headers[":path"],function (err, data) {
					if (err) {
						send404()
					}else{
						respond(mime.getType(headers[":path"]),200,data)
					} 
				})			
			}else if (app.site.pages[headers[":path"]]){
				//console.log("page")
				var data = ""
				var template = ""
				if (app.site.pages[headers[":path"]].content.type == "code") {
					data = app.site.pages[headers[":path"]].content.data
					if (app.site.pages[headers[":path"]].template != false) {
						getTemplate()
					}else{
						respond("html",200,data)
					}	
				}else if (app.site.pages[headers[":path"]].content.type == "file") {
					getFile(app.site.pages[headers[":path"]].content.data,function (err, filedata) {
                                		if (err) {
                                        		send404()
                                		}else{
							data = filedata
                                			if (app.site.pages[headers[":path"]].template != false) {
								data = JSON.parse(data)
                                        			getTemplate()
                                			}else{
								respond("html",200,data)	
							}
                                		}
                        		})	
				}else{
					console.log(`unknown type for ${headers[":path"]}!!`)	
				}

				function getTemplate () {
					//console.log(app.site.pages[headers[":path"]].template)
					if (app.site.templates[app.site.pages[headers[":path"]].template].type == "code") {
						template = app.site.templates[app.site.pages[headers[":path"]].template].template
						respond ("html", 200, eval('`' + template + '`'))
					}else if (app.site.templates[app.site.pages[headers[":path"]].template].type == "file") {
						getFile(app.site.templates[app.site.pages[headers[":path"]].template].template, function (err,templatedata) {
							if (err) {
								send404()
							}else{
								template = templatedata
                                        			respond ("html", 200, eval('`' + template + '`'))
							}
						})
					}else{
						console.log("unknown template type")
					}
				}
			
			}else{
				//console.log("idk")
				send404()
			}
		})

		function send404 () {
			//send 404 - file/resource not found. 
			respond("text",404,"file/resource not found")
		}

		function getFile (file, callback) {
			if (app.config.cache) {
				if (cache[file]) {
					callback(null,cache[file])
					//console.log(`From cache ${file}`)
				}else{
					fs.readFile(file,function (err,data) {
						if (err == null) {
							cache[file] = data
							//console.log(`Cached ${file}`)	
						}
							callback(err,data)	
					})
				}
			}else{
				fs.readFile(file, function (err,data) {
					callback(err,data)
				})
			}
		}

		function postProcessing (data) {

		}

		function respond (type,status,content) {
			stream.respond({
				'content-type': type,
    				':status': status
  			});
  			stream.end(content);
		}
		
	});

	app.server.listen(app.config.ports.https);
	console.log(`Done, Server listening on ${app.config.ports.https}`)
}

function initRedirectServer () {
	//console.log ("loading Http Redirect Server")
	//finish !!!

}

function loadMailer() {
	console.log ("loading nodemailer....")
	mail.transporter = nodemailer.createTransport(app.config.mail.transporter)
	if (app.config.mail.testEmail) {
		var testEmail = {
			from: 'mail@shueit.net',
			to: 'daniel.shue@shueit.net',
			subject: 'Test from webdev site',
			text: 'test',
			html: '<h1>Test</h1>'
		}
		mail.transporter.sendMail (testEmail, function (err,info) {
			if (err) {

			}
			console.log ('%O',info)
		})
	}
	console.log('Done')
}
