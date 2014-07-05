hulken
======

Hulken is a small node tool for simple stress testing of web applications. It can be required and used in your node code but it can also be used as a stand alone command line tool.
When executed from the command line you get some nice output and when executed from within your code you get callbacks with stats.


##Installation
when used as a lib in your app/build script install it locally  
`npm install hulken --save`

when used as a command line tool  
`npm install hulken -g`

##Usage (as a library)

When you require hulken in your node application.
```
var hulken = require('hulken');

var hulken_options = {  
  targetUrl: 'http://localhost:8888',  
  requestsFilePath: './path/to/my/app/hulkenRequests.json'
};  

hulken.run(function(stats){  
  console.log('error ... perhaps i should look closer at the stats');  
  },function(stats){  
  console.log('success! ... auto tweet my stats to the world!');  
},hulken_options);

```
**targetUrl** and **requestsFilePath** are mandatory, but you can also override the following settings:

>**setting name** (default value) | explanation  

* **targetUrl** ("http://localhost") | url to application under test  
* **numberOfHulkenAgents** (1) | number of agents sending requests
* **timesToRunEachRequest** (1) | number of times to execute each request per agent  
* **requestsFilePath** ("./hulkenRequests.json") | path to requestsFile (including file name)  
* **tokensSkippingRequest** ([':']) | requests with urls containing one or more of these chars gets ignored  
* **requestsToSkip** (['/logout', 'signoff']) | requests with urls matching one of the provided urls gets ignored
* **loginRequired** (false) | is a login required to execute the requests?
* **username** ("") | mandatory if loginRequired is true ... the username
* **password** ("") | mandatory if loginRequired is true ... the password
* **usernamePostName** ("username") | the username post name
* **passwordPostName** ("password") | the password post name
* **loginUrl** ("/login") | the url to post to when logging in
* **loginResponseExpectedText** ("") | a text which hulken searches for in the response to the login post (if non is provided hulken will consider http 200 OK good enough)
* **happyTimeLimit** (5) | maximum number of seconds hulken thinks is ok for the whole test
* **happyTimeLimitLocalhost** (10) | the same as happyTimeLimit but if the targetUrl contains 'localhost'

The requestsFile is a json file and looks like this.  
```
[{
“method”:”get”,
“path”:”/index”,
“expectedTextToExist”:”Start”
},
{
“method”:”get”,
“path”:”/about”,
“expectedTextToExist”:”About us”
},
{
“method”: “post”,
“path”: “/”,
“expectedTextToExist”: “thank you for your POST”,
“payload”: {
“foo”: “bar”
}]
```
POSTs require a payload.

If you are running an express 3 application and thinks hand crafting a requests file sounds like a drag check out ***[hulken_informant_express3](https://github.com/hellgrenj/hulken_informant_express3)***.
If you run something else but still want to automate the creation of the requestsFile please make an "hulken_informant_x" out of it and send me the link =)

##Usage (as a command line tool)
When you use hulken from the command line, you should first install it globally.  
`npm install hulken -g`

and then you can use the *hulken* command:
```
hulken myCustomOptions.json
```
The options file is a simple json and looks something like this.
```
{
“targetUrl” : “http://yourapp.com”,
“requestFilePath”: “../path/to/hulkenRequests.json”
}
```  
**You can set the same settings in this file as when you require hulken in your code and passing in an options object.**  
*See Usage (as a library).* Options files make it easy to reuse your requestsFile against different environments.

##Tests
`npm test`

##License
Released under the MIT license. Copyright (c) 2014 Johan Hellgren.
