#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var superAgent = require('superagent');
var expect = require('expect.js');
var async = require('async');
var colors = require('colors');

// globals to this module
var hulken = this;
var hulkenAgent = superAgent.agent();
var hulkHappyCallback;
var hulkAngryCallback;
var hulkenStart;
var hulken_requests = [];
var stressTestRequests = [];
var executedRequests = [];

// defaults that can be overriden by options
var targetUrl = "http://localhost";
var timesToRunEachRequest = 1;
var requestsFilePath = "./hulkenRequests.json";
var tokensSkippingRequest = [':'];
var requestsToSkip = ['/logout', 'signoff'];
var loginRequired = false;
var username = "";
var password = "";
var usernamePostName = "username";
var passwordPostName = "password";
var loginUrl = "/login";
var loginResponseExpectedText = "";
var happyTimeLimit = 5;
var happyTimeLimitLocalhost = 10;

// require() entry point
exports.run = function(error, success, options) {
  overrideDefaultsWithOptions(options, function() {
    hulkHappyCallback = success;
    hulkAngryCallback = error;
    hulkenStart = Date.now();
    console.log('');
    console.log('..::HULKEN SMASH::..'.bold.green);
    console.log('');
    fs.readFile(requestsFilePath, 'utf-8', function(err, data) {
      if (err) throw err;
      hulken_requests = JSON.parse(data);
      buildUp();
    });
  });
};
// command line entry point
if (process.argv.length > 2) { // something more than 'node(index 0) hulken(index 1)'
  if (process.argv[2]) {
    var pathToOptionsFile = process.argv[2];
    console.log('setting options from file '.cyan + pathToOptionsFile.bold.magenta);
    fs.readFile(pathToOptionsFile, 'utf-8', function(err, data) {
      if (err) throw err;
      var hulken_options = JSON.parse(data);
      hulken.run(function() {}, function() {}, hulken_options);
    });
  }
}

function overrideDefaultsWithOptions(options, next) {
  if (options) {
    if (options.timesToRunEachRequest) {
      timesToRunEachRequest = options.timesToRunEachRequest;
      console.log('number of times to repeat each request set to '.cyan +
        timesToRunEachRequest.toString().bold.magenta);
    }
    if (options.targetUrl) {
      targetUrl = options.targetUrl;
      console.log('target url set to '.cyan + targetUrl.bold.magenta);
    }
    if (options.requestsFilePath) {
      requestsFilePath = options.requestsFilePath;
      console.log('request file path (including file name) set to '.cyan +
        requestsFilePath.bold.magenta);
    }
    if (options.tokensSkippingRequest) {
      tokensSkippingRequest = options.tokensSkippingRequest;
      console.log(
        'the following characters (in an url) will cause a request to be skipped '
        .cyan + tokensSkippingRequest.toString().bold.magenta);
    }
    if (options.requestsToSkip) {
      requestsToSkip = options.requestsToSkip;
      console.log('requests to skip set to '.cyan + requestsToSkip.toString()
        .bold.magenta);
    }
    if (options.loginRequired !== null && options.loginRequired !== undefined) {
      loginRequired = options.loginRequired;
      console.log('loginRequired set to '.cyan + loginRequired.toString().bold
        .magenta);
    }
    if (options.username) {
      username = options.username;
      console.log('username set to '.cyan + username.bold.magenta);
    }
    if (options.password) {
      password = options.password;
      console.log(
        'password set ... check options file, im not gonna display it here! =) '
        .cyan);
    }
    if (options.loginUrl) {
      loginUrl = options.loginUrl;
      console.log('loginUrl set to '.cyan + loginUrl.bold.magenta);
    }
    if (options.loginResponseExpectedText) {
      loginResponseExpectedText = options.loginResponseExpectedText;
      console.log('loginResponseExpectedText set to '.cyan +
        loginResponseExpectedText.bold.magenta);
    }
    if (options.happyTimeLimit) {
      happyTimeLimit = options.happyTimeLimit;
      console.log('happyTimeLimit set to '.cyan + happyTimeLimit.toString().bold
        .magenta);
    }
    if (options.happyTimeLimitLocalhost) {
      happyTimeLimitLocalhost = options.happyTimeLimitLocalhost;
      console.log('happyTimeLimitLocalhost set to '.cyan +
        happyTimeLimitLocalhost.toString().bold.magenta);
    }
    if (options.usernamePostName) {
      usernamePostName = options.usernamePostName;
      console.log('usernamePostName set to '.cyan +
        usernamePostName.bold.magenta);
    }
    if (options.passwordPostName) {
      passwordPostName = options.passwordPostName;
      console.log('passwordPostName set to '.cyan +
        passwordPostName.bold.magenta);
    }
  }
  next();
}

function buildUp() {
  var loginPayload = {};
  loginPayload[usernamePostName] = username;
  loginPayload[passwordPostName] = password;

  if (loginRequired) {
    hulkenAgent.post(targetUrl + loginUrl).send(loginPayload).end(function(res) {
      try {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        expect(res.text).to.contain(loginResponseExpectedText);
        console.log('... user authenticated successfully!'.magenta);
        executeRequests();

      } catch (err) {
        console.log(('login failed: ' + err).toString()
          .yellow);
        console.log(
          'HULKEN needs a successful login to execute the requests...'.inverse
          .red);
        process.exit(code = 1);
      }

    });
  } else {
    console.log('... no login required, continuing with anonymous user'.cyan);
    executeRequests();
  }
}

function executeRequests() {
  console.log('... starting to execute requests'.magenta);
  prepRequestsRecursive();
  executeTestSuite();
}

function prepRequestsRecursive(index) {
  if (!index) {
    index = 0;
  }
  var request = hulken_requests[index];
  if (!stringIsInArray(requestsToSkip, request.path) && !stringContainsChar(
    request.path, tokensSkippingRequest)) {
    for (var i = 0; i < timesToRunEachRequest; i++) {
      stressTestRequests.push(function() {
        setTimeout(function() {
          if (request.method.toUpperCase() === 'GET') {
            makeGETrequest(request);
          } else if (request.method.toUpperCase() === 'POST') {
            makePOSTrequest(request);
          } else {
            throw "HTTP VERB " + request.method + " is not supported";
          }
        }, getRandomWaitTime());
      });
    }
  }

  index++;
  if (index < hulken_requests.length) {
    prepRequestsRecursive(index);
  }
}

function makePOSTrequest(request) {
  if (!request.payload) {
    throw "you have to provide a payload for POST requests!";
  }
  var reqStart = Date.now();
  hulkenAgent.post(targetUrl + request.path).send(request.payload).end(function(
    res) {
    handleRequestResult(res, reqStart, request);
  });
}

function makeGETrequest(request) {
  var reqStart = Date.now();
  hulkenAgent.get(targetUrl + request.path).end(function(res) {
    handleRequestResult(res, reqStart, request);
  });
}

function handleRequestResult(res, reqStart, request) {
  var reqStop = Date.now();
  var reqResponseTime = reqStop - reqStart;
  var reqResponseTimeInSeconds = (
    reqResponseTime / 1000);
  if (reqResponseTimeInSeconds > 3) {
    console.log((request.method.toUpperCase() + ' ' + request.path +
        ' responded in ' +
        reqResponseTimeInSeconds.toString().red + ' seconds').toString()
      .grey);
  } else {
    console.log((request.method.toUpperCase() + ' ' + request.path +
        ' responded in ' +
        reqResponseTimeInSeconds.toString().green + ' seconds')
      .toString().grey);
  }

  try {
    expect(res).to.exist;
    expect(res.status).to.equal(200);
    if (request.expectedTextToExist) {
      expect(res.text).to.contain(request.expectedTextToExist);
    }
  } catch (err) {
    console.log(('GET ' + request.path + ' resulted in ' + err).toString()
      .yellow);
  }

  requestExecuted(request.path, reqResponseTimeInSeconds);
}

function executeTestSuite() {
  async.each(stressTestRequests, function(stressReq, handleNextItemInAsyncEach) {
    stressReq(); // fire request and immediately continue to the next..
    handleNextItemInAsyncEach();
  }, function(asyncEachError) { 
    if (asyncEachError) {
      console.log(asyncEachError);
    }
  });
}

function requestExecuted(reqPath, responseTime) {
  executedRequests.push({
    reqPath: reqPath,
    responseTime: responseTime
  });

  if (executedRequests.length === stressTestRequests.length) {
    var hulkenStop = Date.now();
    console.log('.. all requests have been executed'.magenta);
    var hulkenExecutionTime = (hulkenStop - hulkenStart) / 1000;

    var stats = {};
    stats.numberOfConcurrentRequests = stressTestRequests.length;
    stats.numberOfUniqueRequests = (stressTestRequests.length /
      timesToRunEachRequest);
    stats.totalSecondsElapsed = hulkenExecutionTime;
    stats.avgReqResponseTime = (hulkenExecutionTime / stressTestRequests.length);
    stats.reqsPerSecond = (stressTestRequests.length / hulkenExecutionTime);
    stats.randomRequestWaitTime = '1-6 seconds';

    console.log('');
    console.log('**************** RESULT ******************'.bold.cyan);
    console.log('number of concurrent requests ' + stats.numberOfConcurrentRequests
      .toString().magenta);
    console.log('number of unique requests ' + stats.numberOfUniqueRequests.toString()
      .magenta);
    console.log('total seconds elapsed  ' + stats.totalSecondsElapsed.toString()
      .magenta);
    console.log('avg request response time  ' + stats.avgReqResponseTime.toFixed(
      2).magenta + ' seconds');
    console.log('req/sec ' + stats.reqsPerSecond.toFixed(2).magenta);
    console.log('random request wait time' + ' 1-6'.magenta + ' seconds');
    console.log('******************************************'.bold.cyan);
    finsish(hulkenExecutionTime, stats);
  }
}

function finsish(hulkenExecutionTime, stats) {
  var isLocalhost = (targetUrl.indexOf("localhost") > -1);
  if (isLocalhost) {
    if (hulkenExecutionTime < happyTimeLimitLocalhost) {
      console.log('');
      console.log('HULKEN THINKS RESULT OK FOR LOCALHOST'.bold.green);
      console.log('');
      hulkHappyCallback(stats);
    } else {
      console.log('.... BAD RESULT, EVEN FOR LOCALHOST! ...'.bold.green +
        ' HULKEN ANGRY!'.bold.red);
      hulkAngryCallback(stats);
    }
  } else {
    if (hulkenExecutionTime < happyTimeLimit) {
      console.log('');
      console.log('HULKEN PLEASED WITH RESULT, NO ONE NEEDS TO GET HURT TODAY!'
        .bold
        .green);
      console.log('');
      hulkHappyCallback(stats);
    } else {
      console.log('.... BAD RESULT...'.green + ' HULKEN ANGRY'.bold.red);
      hulkAngryCallback(stats);
    }
  }
}

function getRandomWaitTime() {
  var min = 1000; // 1 second
  var max = 6000; // 6 seconds
  var randomWaitTime = Math.random() * (max - min) + min;
  return randomWaitTime;
}

function stringContainsChar(str, tokens) {
  for (var i = 0; i < str.length; i++) {
    for (var j = 0; j < tokens.length; j++) {
      if (str[i] === tokens[j]) {
        return true;
      }
    }
  }
  return false;
}

function stringIsInArray(strArray, str) {
  for (var i = 0; i < strArray.length; i++) {
    if (strArray[i] == str) {
      return true;
    }
  }
  return false;
}
