# What is *node_http2_server*
*node_http2_server* is a simple HTTP2 web server written in node.js. It can server static pages or dynamic built pages from templates, html files or code, markdown files and js scripts.  It also includes the ability to send basic emails 
from a post.

### The config file
The config file is standard JSON file named server-config.json containing two objects "config" and "sitePaths".  the config object defines ports to be used, ssl files, cache (on or off), and email config. sitePaths object 
defines the root "/" (aka index) file or page, public files, pages, scripts and template paths. Ports object defines what ports the server will listen on. HTTP2 is secure server only so the http port redirects over to the https 
port. SSL object defines the ssl certificate file and private key file, the server will not start without a valid ssl cert and key. The server has a in primitive memory cache for to store files read from disk so they do not 
have to be read from disk a second time. This can be turn on or off by changong that cache to true or false. *This has not been throughly tested and assume use a large amount memory use on sites with large numbers of files.* 
With the cache on changes to any priorly loaded files would require a server restart to reflect changes.  The mail object defines the info that nodemailer will use to send out email (see nodemailer for detials on transporter), 
a test email can be sent on server startup by changing the testEmail to true. *currently will email me if the address is not changed in index.js this needs to be fixed.* sitePath object defines the various paths to be used. It 
is possible to use different paths for different domain names. The "*" object catches all undefined domains. If you wanted to have specific paths or root pages for a different domain or subdomain just it can be defined as an 
object , ex "app.shueit.net". "/" is also refered to as index. The server sees a url of www.xyz.com as a request for "/", commonly index.html is served for this request but you can define what ever static file or page you want. 
Public is he directory where all static files should reside. When the server gets a request for anything ending with ".anyfiletype" (example .html or .css) is will preppend this directory to the request. a request for 
www.xyz.com/images/pic.jpeg would be turned into public/images/pic.jpeg. The rest of the paths defined will make more sense once we talk about pages next. Below is a example of config file
 
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
                "*" : {
                        "/": "serverPage",
                        "public": "public",
                        "pages": "pageFiles",
                        "scripts": "pageFiles",
                        "templates": "templates"
                }
        }
	}
	
### What are pages ?
Serving static files and pages are great but their afe few sites left that are truly static. Ok now pages are requests for non-static files. Files requests with out a ".filetype" will look into the directory defined in 
config.pages for a JSON doc that defines how to handle the page request. If found the server will load the file and parse it and set it as "page" variable. It will then look at all the vars in the data object if they are a 
string ending with .html, .md or .markdown it will load that particular file and set the var to the resulting string, at this time will also load any files set in the template object. Once all the files listed in data are 
loaded then it will check to see if the varable "script" is present set. If it is then will load it as a module and exec the "run" function passing the page object and app object to the script. (we'll look at the script part in 
a next.). After the script is completed or if no script is defined the server will look to see if a template is defined. It will parse the templates is order listed it replaceing vars in the template with ones defined in 
page.data . If no template is defined then the data object will be sent as the reply in JSON format. The push_files will be used when the http2 push feature is implemented.

	{
        "template" : {
		"sub" : "serverPageTemplate.html" ,
		"main" : "serverBaseTemplate.html"
	},
        "script" : "script.js",
        "data": {
                "title":"Node HTTP2 Server",
                "section1":"readme.md",
                "section2":"",
                "section3":"messageMe.html",
                "footer": "<div class='column section'><h4 class='center'>powered By:</h4><image class='quarter' src='images/logo.svg'></div>"
        },
        "push_files": []
	}

#### page scripts
Page scripts are defined in page file under content.script var and is loaded as a module using require. the script is passed four variables, req, res, page & app. The req object is the http2/1 request object, res i the response 
objec and page object loaded from page file. The app object is the object the configuration file is loaded too and allows for persistant storage. Each domain name defined in pagePaths will have a object once created on the 
first request. The object will contain scripts which stores loaded scripts and storage for use as a sotrage object available. Once the script is completed a done event is emited and three objects are passed back to the main app 
(req,res,page (app is global). And moves on to the template stage if applicable.
	const eventEmitter = require('events');
	module.exports = new eventEmitter();
	function run (req,res,page,app) {
		page.data.scriptData = "<p>Hello World!</p>"
		module.exports.emit('done',req,res,page);
	}
	module.exports.run = run; A few basic are required in the script we need an exported function and an event emiter and. The exported function is the "run" function which the main app will execute this is done with 
module.exports.run = run. The event emitter is created by requiring the "events" package and using module.exports to export a new event to the main app. The main app will listen for the 'done' event to execute the next action. 
The done event is fired by "module.exports.emit('done',req,res,data)".

#### Templates
The templates use javascript template literals or template strings. The templates are just standard html file with placeholders where data needs to be inserted. Place holders are dollar sign followed by brackets containg the 
var or expression to be inserted, example , ${var}. Because the page object is passed the template function the data object can be accessed or anything in the page object can be.In js back ticks are required to use template 
literals but that is not required, the server takes care of that. Example of a template

	<html>
		<head>
			<title>${page.data.title}</title>
		</head>
		<body>
			<h1>${page.data.section}</h1>
		</body>
	</html>
 
Multiple templates can be used. The page json template object defines template files when the files are loaded they are store to the var that orginally contained their name. After the page data is loaded and 
page script run (if applicable) then the templates are parsed. they will be parse first to last. For example this if you have a template that would just contain the layout for a pages content. That would be parsed inserting the 
content into the layout then that layout can be submitted into another template containing HTML head, your site header and footer.
# Fix
- test email needs to be able have address to send to put in config
# Todo
- Test for errors in differnt configs, if json file or scripts have errors. 
- need a better name for project. 
- add http2 push for required files
# Credits
![Nodemailer logo](https://nodemailer.com/nm_logo_200x136.png) [Nodemailer](https://nodemailer.com/about/) ![marked logo](https://marked.js.org/img/logo-black.svg)
[node-mime](https://github.com/broofa/node-mime)
