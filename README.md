hulken
======

Hulken is a small tool for simple stress testing of web applications. It can be required and used in your code but it can also be used as a stand-alone command line tool.
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
* **happyTimeLimit** (10) | max test suite duration (in seconds). If the whole test takes longer than this value hulken gets angry.
* **slowRequestsTimeLimit** (3) | response times (in seconds) over this value are considered slow
* **angryOnFailedRequest** (false) | Hulken gets angry (calls error callback) if a single request fails
* **chatty** (true) | set to false to make Hulken less chatty
* **happyMessage** ("HULKEN PLEASED WITH RESULT, NO ONE NEEDS TO GET HURT TODAY!") | pass in what you want Hulken to say when Hulken is happy with a result
* **angryMessage** (".... BAD RESULT... HULKEN ANGRY!") | pass in what you want Hulken to say when Hulken is angry with a result
* **minWaitTime** (1000) | minimum wait time in milliseconds (every request waits for a random time before executing)
* **maxWaitTime** (6000) | maximum wait time in milliseconds (every request waits for a random time before executing)

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

**The stats object returned looks like this.**
```
{ numberOfHulkenAgents: 50,
  numberOfConcurrentRequests: 150,
  numberOfUniqueRequests: 3,
  totalSecondsElapsed: 6.001,
  avgReqResponseTime: 0.001806666666666668,
  reqsPerSecond: 24.995834027662056,
  randomRequestWaitTime: '1-6 seconds',
  slowRequests: [],
  failedRequests: [] }
```

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
“requestsFilePath”: “../path/to/hulkenRequests.json”
}
```  
**You can set the same settings in this file as when you require hulken in your code and passing in an options object.**  
*See Usage (as a library).* Options files make it easy to reuse your requestsFile against different environments.

##hulken_informant's
an hulken_informant offers a quick and simple way to create a stress test suite by inspecting your application routes and auto generating the requests file for you!

[hulken_informant_express3 (works with express3)](https://www.npmjs.org/package/hulken_informant_express3)  
[hulken_informant_hapi (works with hapi.js)](https://www.npmjs.org/package/hulken_informant_hapi)

##Blog posts
[Automatically generated stress tests with hulken and hulken informant](http://hellgrenj.tumblr.com/post/90755234673/automatically-generated-stress-tests-with-hulken-and)

##Release notes
**0.6.1** (minor bug fix)
* stats object returned now containing correct randomRequestWaitTime

**0.6.0** (non breaking changes only)
* minWaitTime can now be passed in as an option
* maxWaitTime can now be passed in as an option

**0.5.0** (non breaking changes only)
* pass in "chatty: false" to make Hulken less chatty!
* happyMessage can now be passed in as an option
* angryMessage can now be passed in as an option

**0.4.0** (non breaking changes only)
* angryOnFailedRequest can now be passed in as an option
* now returning all failed requests (http errors, wrong expectedTextToExist etc) not only connection errors


**0.3.1** (non breaking changes only)
* added a new hulken informant for hapi.js

**0.3.0**   (non breaking changes only)
* Improved connection error handling
* slowRequestsTimeLimit can now be passed in as an option
* stats object now contains all slow requests and all failed requests

##Tests
`npm test`

##License
Released under the MIT license. Copyright (c) 2014 Johan Hellgren.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
