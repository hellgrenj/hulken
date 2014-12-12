hulken
======

Hulken is a stress testing tool for everything speaking HTTP. Hulken supports multiple urls, GETs and POSTs, static and dynamic payloads, multiple agents and more. Hulken is highly configurable but defaults to some reasonable settings. Hulken works both as a library and a stand-alone command line tool. *Hulken is swedish for The Hulk*.


##Quick Examples
###as a library:

`npm install hulken --save`


```
var hulken = require('hulken');

var hulken_options = {  
  targetUrl: 'http://localhost:8888',  
  requestsFilePath: './path/to/my/hulkenRequests.json'
};  

hulken.run(function(stats){  
  console.log('error ... perhaps i should look closer at the stats');  
  },function(stats){  
    console.log('success! ... auto tweet my stats to the world!');  
    },hulken_options);

```
*(you can override a lot of default settings, [see documentation](#settings))*

the **requestsFilePath** points to a json file like this:
```
[{
  "method":"get",
  "path":"/index",
  "expectedTextToExist":"Start"
 },
 {
    "method":"get",
    "path":"/about",
    "expectedTextToExist":"About us"
 },
 {
    "method": "post",
    "path": "/",
    "expectedTextToExist": "thank you for your POST",
    "payload": {
      "foo": "bar"
     }
}]
```
*(you can also send dynamic payloads, [see documentation ](#dynamicPayloads)  )*  
**checkout ./tests/integrations.js for more examples!**

###as a command line tool

`npm install hulken -g`

Create a 'options.json' file with the following content.
the **requestsFilePath** points to the same hulkenRequests.json as in the example above (as a library). Make sure you have one!
```
{
  "targetUrl" : "http://yourapp.com",
  "requestsFilePath": "./path/to/my/hulkenRequests.json"
}
```
*(you can have hulken generate an example options for you, [see documentation](#commandLineTricks))*


and then you can use the **hulken** command to run a stress test:
```
hulken options.json
```
**option files makes it easy to reuse requests files when targeting different environments (dev, test, staging etc..)**

##Documentation
[1.) Settings you can override through options ](#settings)  
[2.) Dynamic payloads ](#dynamicPayloads)  
[3.) The stats ](#theStats)  
[4.) Command line tricks ](#commandLineTricks)  
[5.) Automatically generate requests files with Informants ](#informants)  
[6.) Smash responsibly - It is your foot!  ](#smashResponsibly)  
[7.) Release notes ](#releaseNotes)  
[8.) Tests ](#tests)  
[9.) License ](#license)

###Settings
<a name="settings"></a>
When you use hulken as a library you override these settings in the options object you pass in. When you use hulken as a command line tool you override these settings in the options file.

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
* **headers** ({}) | set HTTP headers in a simple object: {
  "key1": "value1",
  "key2": "value2",
  "accept-encoding": "Overriden"
  }. These headers will be set for every request in the test.
* **requestValueLists** ({}) | insert value lists in a simple object: {
    usernames: ['john', 'jessica','admin'],
    cities: ['Stockholm', 'London', 'Berlin', 'New York']
  }


###Dynamic payloads
<a name="dynamicPayloads"></a>

POSTs require a payload.

Besides hard coded values you can let hulken generate random post values consisting of letters, numbers or letters and numbers. The syntax is as follows:

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
}
```

You can also pass in **value lists** with your options file/object and have hulken pick randomly from these when executing the requests.

The syntax in your request is as follows:  
`::randomList <nameOfList>`

in options pass in:
```
requestValueLists : {
  usernames: ['john', 'jessica','admin'],
  cities: ['Stockholm', 'London', 'Berlin', 'New York']
}
```
and then in your requests file have a post that looks like this:
```
{
  "method": "post",
  "path": "/RandomList",
  "expectedTextToExist": "you have sent /RandomList a POST request",
  "payload": {
    "username": "::randomList usernames",
    "city" : "::randomList cities"
  }
}
```

###The stats
<a name="theStats"></a>
When you use hulken as a library you get callbacks with stats. This is what this stats object looks like. This object can also contain **allRequests** see [Settings](#settings)
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

###Command line tricks
<a name="commandLineTricks"></a>

Hulken can generate an example options file for you, all you have to do is provide the target url.
```
hulken make_options http://localhost:8080
```


###Automatically generate requests files with Informants
<a name="informants"></a>
an hulken_informant offers a quick and simple way to create a stress test suite by inspecting your application routes and auto generating the requests file for you!

[hulken_informant_express3 (works with express3)](https://www.npmjs.org/package/hulken_informant_express3)  
[hulken_informant_hapi (works with hapi.js 7)](https://www.npmjs.org/package/hulken_informant_hapi)  

**missing your framework?**  
feel free to create a *hulken_informant_x* and send me the link

###Smash responsibly!
<a name="smashResponsibly"></a>
Hulken knows no limits! Be it number of agents, times to execute each request or the length of a randomly generated post value. **IT IS YOUR FOOT! =)** Seriously though - how could hulken enforce any reasonable limits? What is reasonable depends on the application under test and the machine executing the test.

###Release notes
<a name="releaseNotes"></a>
**1.0.0** (non breaking changes only)
* hulken can now pick post payloads randomly from value lists, [see documentation](#dynamicPayloads)
* cleaned up README
* added some tests

**0.10.2** (non breaking changes only)
* removed unnecessary dependency on async

**0.10.1** (non breaking changes only)
* minor fixes

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


###Tests
<a name="tests"></a>
`npm test`

###License
<a name="license"></a>
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
