# Release changes

# ver 1.01.1


## Major changes

content tree is now directory based. sites (host, www.xzy.com) will be at root of path defined in contentPath. Default catch any not otherly defined is '*' dir. below this directory will contain following directories;
static (for statis files, html, css, images exc.), pages ( files for dynamic built sites based on JSON files), scripts (script files to be run if defined in page JSON), templates (templates to be used for pages if defined in page json)

example; 
	
	./sites (actual dir defined in config.contentPath
	  |
	  |-'*'
	  |  |-static
	  |  |-pages
	  |  |-scrpits
	  |  |_templates
	  |
	  |_www.xyz.com
	     |-static
	     |-pages
	     |-scripts
	     |_templates 
	
## config changes

no longer need to define sitePages object. This will auto generate based on contents of contentPath definded in config object.

example;
	
	{
		"config": {
			"ports": {
				"http": 80,
				"https": 443
			},
			"ssl": {
				"cert": "certs/fullchain.pem",
				"key": "certs/privkey.pem"
			},
			"cache": false,
			"logging": true,
			"contentPath": "./sites",
			"indexFile": "index",
			"mail": {
				"transporter": {
	                                "host": "mail.dreamscape.com",
	                                "port": 587,
	                                "secure": false,
	                                "ignoreTLS": true,
	                                "auth": {
	                                        "user": "#####.com",
	                                        "pass": "#####"
					}
				},
				"testEmail": true
			}
		}
	}

## changes to index.js

index.js has been changed to prefetch the contents of the path defined in config.contentPath, create app.sitePaths object with object for each directory defined. 
if new directory "site" dir is add to contentPath server will need restart to load it into oby. 

## To Do in 

### primary 
 - push files
   - rewrite http2 from compAPI using req,res objects to stream or use response.createPushResponse()
   - check see if push allowed
   - stream.pushStream() or response.createPushResponse()

#### Second
 - move email option out of index.js should be able to implement in a page & script

