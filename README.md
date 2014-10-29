hulken
======

Hulken is a small tool for simple stress testing of web applications. It can be required and used in your code but it can also be used as a stand-alone command line tool.
When executed from the command line you get some nice output and when executed from within your code you get callbacks with stats.
Hulken is Swedish for The Hulk.

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
* **returnAllRequests** (false) | If true the stats object will contain all executed requests (stats.allRequests)
* **headers** ({}) | set HTTP headers in a simple object: {'key1', 'value1', 'key2', 'value2'}. These headers will be set for every request in the test.

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
}}]
```
**about POST's**
<a name="moreOnPosts"></a>

POSTs require a payload.

Besides hard coded values (see "bar" in the example above) you can let hulken generate random post values consisting of letters, numbers or letters and numbers. The syntax is as follows:

`::random <valuetype> <numberOfChars>`

available value types are **numbers** [0-9], **letters** [A-Za-z] and **lettersandnumbers** [A-Za-z0-9].

For example, the request below will send a POST to the url */random* with a payload consisting of 3 generated property values. *random* will be a 10 characters long string of letters and numbers. *random2* will be a 15 characters long string of numbers. *random3* will be a 20 characters long string of letters.
```
{
  "method": "post",
  "path": "/random",
  "expectedTextToExist": "thank you for the random value",
  "payload": {
    "random": "::random lettersandnumbers 10",
    "random2": "::random numbers 15",
    "random3": "::random letters 20"
  }
```
(*When using the **::random** command a randomly generated value is created every time the request gets executed. If you run multiple iterations (i.e hulken_options.timesToRunEachRequest > 1) every request will get a new randomly generated value*)

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

and then you can use the *hulken* command to run a stress test:
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
Hulken can even generate an example options file for you, all you have to do is provide the target url.
```
hulken make_options http://localhost:8080
```

**You can set the same settings in this options file as when you require hulken in your code and passing in an options object.**  
*See Usage (as a library).* Options files make it easy to reuse your requestsFile against different environments.

##hulken_informant's
an hulken_informant offers a quick and simple way to create a stress test suite by inspecting your application routes and auto generating the requests file for you!

[hulken_informant_express3 (works with express3)](https://www.npmjs.org/package/hulken_informant_express3)  
[hulken_informant_hapi (works with hapi.js)](https://www.npmjs.org/package/hulken_informant_hapi)  
**missing your framework?**  
feel free to create a *hulken_informant_x* and send me the link

##Smash responsibly!
Hulken knows no limits! Be it number of agents, times to execute each request or the length of a randomly generated post value. **IT IS YOUR FOOT! =)** Seriously though - how could hulken enforce any reasonable limits? What is reasonable depends on the target under test and the machine executing the test.
##Blog posts
[The shortest path to stress tests ](http://hellgrenj.tumblr.com/post/96170338318/the-shortest-path-to-stress-tests)  
[Automatically generated stress tests with hulken and hulken informant](http://hellgrenj.tumblr.com/post/90755234673/automatically-generated-stress-tests-with-hulken-and)

##Release notes
**0.10.0** (non breaking changes only)
* hulken can now generate random post values. (instead of {"foo" : "bar"} you do {"foo" : "::random letters 10"}. read more about it [here](#moreOnPosts).
* minor refactoring (mostly improving integration tests)


**0.9.0** (non breaking changes only)
* set HTTP headers for every request in the test by passing in the option ```headers : {'key1' : 'value1', 'key2' : 'value2'}```
* minor code refactoring

**0.8.0** (non breaking changes only)
* pass in option ```returnAllRequests: true``` to include all executed requests (path and response time) in the stats object

**0.7.4** (non breaking changes only)
* minor fixes

**0.7.3** (bug fixes)
* fixed a bug that came with the latest refactoring

**0.7.1** (non breaking changes only)
* code refactoring and minor fixes

**0.7.0** (non breaking changes only)
* Hulken can now generate an example options file when executed from the command line.
 ```hulken make_options http://localhost:8080``` will create
an example options file with http://localhost:8080 as the targetUrl.

**0.6.1** (minor bug fix)
* stats object returned now containing correct randomRequestWaitTime

**0.6.0** (non breaking changes only)
* minWaitTime can now be passed in as an option
* maxWaitTime can now be passed in as an option

**0.5.0** (non breaking changes only)
* pass in "chatty: false" to make Hulken less chatty!
* happyMessage can now be passed in as an option
* angryMessage can now be passed in as an option

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
