#!./node
"use strict";
const http2 = require('http2');
const http = require('http');
const fs = require('fs');
const mime = require('mime');
const nodemailer = require('nodemailer');
const marked = require('marked');

var app = {};

(//Init - load config file
	function () {
		console.log(`loading config...`) 
		try {
			var data = fs.readFileSync("server-config.json")
			app = (JSON.parse(data))
			app.cache = {};
			app.mail = {};
			//app.scripts = {};
			app.storage = {};
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
		cert : app.ssl.cert,
		allowHTTP1 : true
	})
	app.server.on('error', (err) => console.error(err));
	app.server.on('socketError', (err) => console.error(err));
	app.server.on('request', (req,res) => {
		//console.log(req)
		var postData='';
		req.on('data',function (chunk) {
			postData=(postData += chunk)
			//console.log('a chunk')
		})
		req.on('end', function () {
			req.host = app.sitePaths[(req.httpVersion === "2.0" ? req.headers[":authority"] : req.headers.host)] ? (req.httpVersion === "2.0" ? req.headers[":authority"] : req.headers.host) : "*"
			if (!app[req.host]){
				app[req.host] = { scripts : {}, storage : {} }
			}
			if (req.url == "/") {
				req.url = app.sitePaths[req.host]["/"]
				console.log(`It's a "/" so servering ${req.url}`)
			}
			if (req.method == "POST") {
				//Handle posted Data
				//console.log(postData)
				if (req.url == "/sendEmail") {
					sendEmail(req,res,JSON.parse(postData))
				}else{
					pageReq(req,res,postData)
				}		
			}else if (mime.getType(req.url)) { //check if known file type
				//serve static files
				//console.log('to Serve static')
				serveStatic(req,res)			
			}else{
				//attempt to handle as a json page
				//console.log("page request") 
				pageReq(req,res,null)
			}
		})
	})
	function send404 (req,res,err) {
		//send 404 - file/resource not found.
		if (err) { 
			respond(req,res,"text",404,JSON.stringify(err))
		}else{
			respond(req,res,"text",404,"File/resource not found")
		}
	}
	function serveStatic (req,res) {
                getFile(app.sitePaths[req.host].public + req.url,function (err, data) {
                        if (err) {
                                send404(req,res)
                        }else{
				//console.log(`serving ${headers[":path"]}`) 
                                respond(req,res,mime.getType(req.url),200,data)
                        }
                })
	}
	function pageReq(req,res,postData) {
		getFile(`${app.sitePaths[req.host].pages}/${req.url}.json`,function (err,page){
			if (err) {
				send404(req,res)
			}else{
				getPageFiles(page)
			}
		})
		function getPageFiles(page) {
			//try { 
				page = JSON.parse(page)
				//console.log(page)
				page.postData = postData
				var files = [],loaded = [],objs = [page.data,page.template]
				objs.forEach(function (obj) {
					if (obj) { identifyFiles(obj,[".html",".md",".markdown"],function (file) {files.push(obj[file])}) }
				})
				files.sort()
				//console.log(files)
				if (files.length == loaded.length) {
					nextAction()
				}else{
					for (var i = 0; i < objs.length;i++) {
						var obj = objs[i]
						var folder = i == 0 ? "pages" : "templates"
						if (obj) {
							identifyFiles(obj,[".html",".md",".markdown"],function (file) {
								fileGetter(`${app.sitePaths[req.host][folder]}/${obj[file]}`, obj, file,  function (err) {
									if (err) {
										send404(req,res,err)
									}else{
										//console.log(loaded)
										loaded.sort()
										if (files.toString() == loaded.toString()) {
											nextAction()
										}
									}
								})
							})
						}
					}
				}
			//}catch (err) {
			//	send404(req,res,err)
			//}
			function identifyFiles (obj,cond,callback) {
	                        for(var file in obj) {
        	                        if ( cond == "*") {
						callback(file)
                	                        //array.push(obj[file])
                        	        }else if (Array.isArray(cond)){
						cond.forEach(function (val) {
							if (obj[file].endsWith(val)) {
								callback(file)
								//array.push(obj[file])
							}
						})
					}else if (obj[file].endsWith(cond)) {
						callback(file)
						//array.push(obj[file])
					}
                        	}
			} 
			function fileGetter (file, object, key, callback) {
				//console.log("filegetter")
                        	getFile(file, function (err,fileData) {
					loaded.push(object[key])
					if (err) {
						console.log(err)
						err.error = "Resource Failed to load"
						object[key] = "Error: Resource Failed to load" 
						callback(err)
					}else{
						fileData = fileData.toString('utf8')
						object[key] = file.endsWith(".md") || file.endsWith(".markdown") ?  marked(fileData) : fileData
						callback()
					}	                                
                                })
			}
			function nextAction () {
				//console.log(page)
				if (page.script) {
					pageScript(req,res,page)
				}else if (page.template) {
					parseTemplates(req,res,page)
				}else{
					respond(req,res,mime.getType(".json"),200,JSON.stringify(page))
				}       
                        }
		}
	}
	function pageScript (req,res,page) {
		if ( app[req.host].scripts[page.script] ) {
		        app[req.host].scripts[page.script].run(req,res,page,app)
		}else{
			loadModule(page.script, req.host, function () {
				app[req.host].scripts[page.script].on('done',function (req,res,page) {
					//console.log(app)
					if (page.template) {
                				parseTemplates(req,res,page)
					}else{
						respond(req,res,mime.getType(".json"),200,JSON.stringify(page))
					}	
        			})
				app[req.host].scripts[page.script].run(req,res,page,app)
			})
		}	
	}
        function parseTemplates (req,res,page) {	
		//console.log(page)
		var data = page.data
               	for (var s in page.template) {
			try {
				page.template[s]=eval('`' + page.template[s] + '`')
			}catch (err) {
				console.log(err)
			}
		}
		respond(req, res, mime.getType(".html"), 200, page.template.main)
	}

	function sendEmail (req,res,email) {
		//console.log(email)
		app.mail.transporter.sendMail (email, function (err,info) {
                       	if (err) {
				var resp = {};
				resp.sent = false
				resp.err = err					
				respond(req,res,mime.getType(".json"),200,JSON.stringify(resp))
                        }else{
                       		//console.log ('%O',info)
				respond(req,res,mime.getType(".json"),200,'{"sent": "true"}')
			}
               	})
	}

	function getFile (file, callback) {
		if (app.config.cache) {
			if (app.cache[file]) {
				callback(null,app.cache[file])
				//console.log(`From cache ${file}`)
			}else{
				fs.readFile(file,function (err,data) {
					if (err == null) {
						app.cache[file] = data
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

	function respond (req,res,type,status,content) {
		try {
			res.writeHead(status,{
				'content-type': type,
    				'status': status
  			});
  			res.end(content);
		}catch (err){
			console.log(err)
		}
	}
	
	app.server.listen(app.config.ports.https);
	console.log(`Done, Server listening on ${app.config.ports.https}`)
	initRedirectServer()
}

function initRedirectServer () {
	console.log ("loading Http Redirect Server")
	app.httpServer = http.createServer(redirect);
	app.httpServer.listen(app.config.ports.http)
	console.log(`Done, redirecting port ${app.config.ports.http} to ${app.config.ports.https}`)
}

function redirect  (req,res) {
	//consoleLog( 'Http request for  ' +  headers[':path'])
	//consoleLog(headers)
	res.writeHead(301,
		{'Location': `https://${req.headers.host}${req.url}`}
	)
	res.end()
}

function loadMailer() {
	console.log ("loading nodemailer....")
	app.mail.transporter = nodemailer.createTransport(app.config.mail.transporter)
	if (app.config.mail.testEmail) {
		var testEmail = {
			from: 'mail@shueit.net',
			to: 'daniel.shue@shueit.net',
			subject: 'Test from webdev site',
			text: 'test',
			html: '<h1>Test</h1>'
		}
		app.mail.transporter.sendMail (testEmail, function (err,info) {
			if (err) {
				console.log ('%O',err)
			}else{
				console.log ('%O',info)
			}
		})
	}
	console.log('Done')
}

function loadModule (path,host,callback) {
	var file = "./" + app.sitePaths[host].scripts + "/" + path;
       	app[host].scripts[path] = require(file);
	callback()
}
