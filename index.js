"use strict";
const http2 = require('http2');
const http = require('http');
const fs = require('fs');
//const os = require('os');
const mime = require('mime');
const nodemailer = require('nodemailer');

const config_path = "server-config.json";
var app = {};
var cache = {};
var mail = {};
var scripts = {};
var ip = "test";

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
		//console.log(headers)
		var postData='';
		stream.once('data',function (chunk) {
			postData=(postData += chunk)
			//console.log('a chunk')
		})

		stream.on('end', function () {
			//console.log(headers[":path"])
			if (headers[":path"] == "/") {
				headers[":path"] = app.sitePaths["/"]
				//console.log(headers[":path"])
			}
			if (headers[":method"] == "POST") {
				//Handle posted Data
				//console.log(postData)
				postProcessing(stream,headers,postData)		
			}else if (headers[":path"].includes(".") == true) {
				//Serve static files
				//console.log('to Serve static')
				serveStatic(stream,headers)			
			}else{
				//attempt to handle as a json page 
				getPageData(stream,headers)
			}
		})
	})

		function send404 (stream,headers) {
			//send 404 - file/resource not found. 
			respond(stream,"text",404,"file/resource not found")
		}

		function serveStatic (stream,headers) {
                	getFile(app.sitePaths.public + headers[":path"],function (err, data) {
                        	if (err) {
                                	send404(stream,headers)
                                }else{
					//console.log(`serving ${headers[":path"]}`) 
                                        respond(stream,mime.getType(headers[":path"]),200,data)
                                }
                       	})
		}

		function getPageData (stream,headers) {
			 getFile(app.sitePaths.pages + "/" + headers[":path"] + ".json",function (err, fileData) {
                                if (err) {
					//console.log(`Err at get page data ${err}`)
                                        send404(stream,headers)
                                }else{
                                	var page = JSON.parse(fileData)
					if (page.content.script) {
						pageScript(stream,headers,page)
					}else if (page.template) {
						getTemplate(stream,headers,page)	
					}else{
						respond(stream,mime.getType(".json"),200,page)
					}
                                }
                        })
		}

		function pageScript (stream,headers,page) {
			if ( scripts[page.content.script] ) {
		        	scripts[page.content.script].run(stream,headers,page)
			}else{
				loadModule(page.content.script, function () {
					scripts[page.content.script].on('done',function (stream,headers,page) {
					        //console.log(page)
                				getTemplate(stream,headers,page)
        				})
					scripts[page.content.script].run(stream,headers,page)
				})
			}	
		}

                function getTemplate (stream,headers,page) {
                	getFile(app.sitePaths.templates + "/" + [page.template], function (err,templateData) {
                            	if (err) {
                                	send404(stream,headers)
                                }else{
                                	var template = templateData
					var data = page.content.data
                                        respond (stream,"html", 200, eval('`' + template + '`'))
                                }
                        })
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

		function postProcessing (stream,headers,postData) {
			respond(stream,"text",200,postData)
		}

		function respond (stream,type,status,content) {
			stream.respond({
				'content-type': type,
    				':status': status
  			});
  			stream.end(content);
		}
		
	//});

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

function loadModule (path,callback) {
	var file = "./" + app.sitePaths.scripts + "/" + path;
       	scripts[path] = require(file);
        /*scripts[path].on('done',function (stream,headers,page) {
		console.log(page)
                getTemplate(stream,headers,page)
        })*/
	callback()
}
