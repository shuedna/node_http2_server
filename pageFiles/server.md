# What is *blank*
*blank* is a simple HTTP2 web server written in node.js. It can server static pages or dynamic built pages from templates, html files or code, markdown files and js scripts.  It also includes the ability to send basic emails from a post. 

### The config file
The config file is standard JSON file named server-config.json containing two objects "config" and "sitePaths".  the config object defines ports to be used, ssl files, cache (on or off), and email config. sitePaths object defines the root "/" (aka index) file or page, public files, pages, scripts and template paths. Ports object defines what ports the server will listen on. HTTP2 is secure server only so the http port redirects over to the https port. SSL object defines the ssl certificate file and private key file, the server will not start without a valid ssl cert and key. The server has a in primitive  memory cache for to store files read from disk so they do not have to be read from disk a second time. This can be turn on or off by changong that cache to true or false. *This has not been throughly tested and assume use a large amount memory use on sites with large numbers of files.* With the cache on changes to any priorly loaded files would require a server restart to reflect changes.  The mail object defines the info that nodemailer will use to send out email (see nodemailer for detials on transporter), a test email can be sent on server startup by changing the testEmail to true. *currently will email me if the address is not changed in index.js this needs to be fixed.* 
sitePath object defines the various paths to be used. "/" is also refered to as index. The server sees a url of www.xyz.com as a request for "/", commonly index.html is served for this request but you can define what ever static file or page you want. Public is he directory where all static files should reside. When the server gets a request for anything ending with ".anyfiletype" (example .html or .css) is will preppend this directory to the request. a request for www.xyz.com/images/pic.jpeg would be turned into public/images/pic.jpeg. The rest of the paths defined will make more sense once we talk about pages next. Below is a example of config file  
 
example
   
	{
        "config": {
                "ports": {
                        "http": 80,
                        "https": 443
                },
                "ssl": {
                        "cert": "/etc/letsencrypt/live/shueit.net/fullchain.pem",
                        "key": "/etc/letsencrypt/live/shueit.net/privkey.pem"
                },
                "cache": true,
                "mail": {
                        "transporter": {
                                "host": "smtp.ethereal.email",
                                "port": 587,
                                "secure": false,
                                "auth": {
                                        "user": "qqcam5uaoa74cdoy@ethereal.email",
                                        "pass": "Aq3YeR7utDeS9WN1Mf"
                                }
                        },
                        "testEmail": false
                }
        },
        "sitePaths": {
                "/": "mainPage",
                "public": "public",
                "pages": "pageFiles",
                "scripts": "pageFiles",
                "templates": "templates"
        }
	}
	
### What are pages ?
Serving static files and pages are great but their afe few sites left that are truly static.   
Ok now pages are requests for non-static files. Files requests with out a ".filetype" will look into the directory defined in config.pages for a JSON doc that defines how to handle the page request. If found the server will load the file and parse it and set it at page variable. It will then look at all the vars in the content.data object if they are a string ending with .html, .md or .markdown it will load that particular file and set the var to the resulting string. Once all the files listed in data are loaded then it will check to see if the content.script has a file set. If it does it will load it as a module and exec the "run" function passing the page object to the script. (we'll look at the script part in a next.). After the script is completed or if no script is defined the server will look to see if a template is defined. It will load the template and parse it replaceing vars in the template with ones defined in page.content.data. . If no template is defined then the data object will be sent as the reply in JSON format. 

	{
        "template" : "t1",
        "content" : {
                "script":"script.js",
                "data": {
                        "title":"Node HTTP2 Server",
                        "section1":"server.md",
                        "section2":"",
                        "section3":"emailMe.html",
                        "footer": "<div class='column section'><h4 class='center'>powered By:</h4><image class='quarter' src='images/logo.svg'></div>"
                }
        },
        "push_files": []
	}

#### page scripts 
Page scripts are defined in page file under content.script var and is loaded as a module using require. the script is passed three variables, stream, headers and page. Steam is the http2 data stream, headers the headers and page object loaded from page file. Once the script is completed a done event is emited and the three objects are passed back to the main app. And moves on to the template stage if applicable. 

	const eventEmitter = require('events');

	module.exports = new eventEmitter();

	function run (stream,headers,data) {
		data.scriptData = "<p>Hello World!</p>"
		module.exports.emit('done',stream,headers,data);
	}

	module.exports.run = run;

A few basic are required in the script we need an exported function and an event emiter and. The exported function is the "run" function which the main app will execute this is done with module.exports.run = run. The event emitter is created by requiring the "events" package and using module.exports to export a new event to the main app. The main app will listen for the 'done' event to execute the next action. The done event is fired by "module.exports.emit('done',stream,headers,data)".

#### Templates 
Ahh templates 

# Fix

test email needs to be able have address to send to put in config 


# Credits

![Nodemailer logo](https://nodemailer.com/nm_logo_200x136.png) Nodemailer  https://nodemailer.com/about/

![marked logo](https://marked.js.org/img/logo-black.svg)

node-mime  https://github.com/broofa/node-mime
