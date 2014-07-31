#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var superAgent = require('superagent');
var expect = require('expect.js');
var async = require('async');
var colors = require('colors');

var hulken = this;
hulken.init = function() {
  hulken.settings = {};
  hulken.agents = [];
  hulken.requests = [];
  hulken.executedRequests = [];
  hulken.failedRequests = [];
  hulken.slowRequests = [];
  setDefaults();
}
hulken.getAvgResponseTime = function() {
  var totalRespTime = 0;
  for (var i = 0; i < hulken.executedRequests.length; i++) {
    totalRespTime += hulken.executedRequests[i].responseTime;
  }
  return (totalRespTime / hulken.requests.length);
}

function setDefaults() {
  hulken.settings.targetUrl = "http://localhost";
  hulken.settings.timesToRunEachRequest = 1;
  hulken.settings.requestsFilePath = "./hulkenRequests.json";
  hulken.settings.tokensSkippingRequest = [':'];
  hulken.settings.requestsToSkip = ['/logout', 'signoff'];
  hulken.settings.loginRequired = false;
  hulken.settings.username = "";
  hulken.settings.password = "";
  hulken.settings.usernamePostName = "username";
  hulken.settings.passwordPostName = "password";
  hulken.settings.loginUrl = "/login";
  hulken.settings.loginResponseExpectedText = "";
  hulken.settings.happyTimeLimit = 10;
  hulken.settings.numberOfHulkenAgents = 1;
  hulken.settings.slowRequestsTimeLimit = 3;
  hulken.settings.angryOnFailedRequest = false;
}


exports.run = function(error, success, options) {
  hulken.init();
  overrideDefaultsWithOptions(options, function() {
    prepareHulkenAgents();
    hulken.happyCallback = success;
    hulken.angryCallback = error;
    hulken.start = Date.now();
    console.log('');
    console.log('..::HULKEN SMASH::..'.bold.green);
    console.log('');
    fs.readFile(hulken.settings.requestsFilePath, 'utf-8', function(err, data) {
      if (err) throw err;
      hulken.requestsInfo = JSON.parse(data);
      authenticateAgentsRecursive();
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

function prepareHulkenAgents() {
  for (var i = 0; i < hulken.settings.numberOfHulkenAgents; i++) {
    var agent = superAgent.agent();
    agent.id = (i + 1);
    hulken.agents.push(agent);
  }
}

function overrideDefaultsWithOptions(options, next) {
  if (options) {
    if (options.timesToRunEachRequest) {
      hulken.settings.timesToRunEachRequest = options.timesToRunEachRequest;
      console.log('number of times to repeat each request set to '.cyan +
        hulken.settings.timesToRunEachRequest.toString().bold.magenta);
    }
    if (options.targetUrl) {
      hulken.settings.targetUrl = options.targetUrl;
      console.log('target url set to '.cyan + hulken.settings.targetUrl.bold.magenta);
    }
    if (options.requestsFilePath) {
      hulken.settings.requestsFilePath = options.requestsFilePath;
      console.log('request file path (including file name) set to '.cyan +
        hulken.settings.requestsFilePath.bold.magenta);
    }
    if (options.tokensSkippingRequest) {
      hulken.settings.tokensSkippingRequest = options.tokensSkippingRequest;
      console.log(
        'the following characters (in an url) will cause a request to be skipped '
        .cyan + hulken.settings.tokensSkippingRequest.toString().bold.magenta);
    }
    if (options.requestsToSkip) {
      hulken.settings.requestsToSkip = options.requestsToSkip;
      console.log('requests to skip set to '.cyan + hulken.settings.requestsToSkip
        .toString()
        .bold.magenta);
    }
    if (options.loginRequired !== null && options.loginRequired !== undefined) {
      hulken.settings.loginRequired = options.loginRequired;
      console.log('loginRequired set to '.cyan + hulken.settings.loginRequired.toString()
        .bold
        .magenta);
    }
    if (options.username) {
      hulken.settings.username = options.username;
      console.log('username set to '.cyan + hulken.settings.username.bold.magenta);
    }
    if (options.password) {
      hulken.settings.password = options.password;
      console.log(
        'password set ... check options file, im not gonna display it here! =) '
        .cyan);
    }
    if (options.loginUrl) {
      hulken.settings.loginUrl = options.loginUrl;
      console.log('loginUrl set to '.cyan + hulken.settings.loginUrl.bold.magenta);
    }
    if (options.loginResponseExpectedText) {
      hulken.settings.loginResponseExpectedText = options.loginResponseExpectedText;
      console.log('loginResponseExpectedText set to '.cyan +
        hulken.settings.loginResponseExpectedText.bold.magenta);
    }
    if (options.happyTimeLimit) {
      hulken.settings.happyTimeLimit = options.happyTimeLimit;
      console.log('happyTimeLimit set to '.cyan + hulken.settings.happyTimeLimit
        .toString().bold
        .magenta);
    }
    if (options.usernamePostName) {
      hulken.settings.usernamePostName = options.usernamePostName;
      console.log('usernamePostName set to '.cyan +
        hulken.settings.usernamePostName.bold.magenta);
    }
    if (options.passwordPostName) {
      hulken.settings.passwordPostName = options.passwordPostName;
      console.log('passwordPostName set to '.cyan +
        hulken.settings.passwordPostName.bold.magenta);
    }
    if (options.numberOfHulkenAgents) {
      hulken.settings.numberOfHulkenAgents = options.numberOfHulkenAgents;
      console.log('numberOfHulkenAgents set to '.cyan +
        hulken.settings.numberOfHulkenAgents.toString().bold.magenta);
    }
    if (options.slowRequestsTimeLimit) {
      hulken.settings.slowRequestsTimeLimit = options.slowRequestsTimeLimit;
      console.log('slowRequestsTimeLimit set to '.cyan +
        hulken.settings.slowRequestsTimeLimit.toString().bold.magenta);
    }
    if(options.angryOnFailedRequest){
      hulken.settings.angryOnFailedRequest = options.angryOnFailedRequest;
      console.log('angryOnFailedRequest set to '.cyan +
        hulken.settings.angryOnFailedRequest.toString().bold.magenta);
    }
  }
  next();
}

function authenticateAgentsRecursive(index) {
  if (!index) {
    index = 0;
  }
  var hulkenAgent = hulken.agents[index];
  console.log(('initiating agent ' + (index + 1).toString() + ' of ' + hulken.agents
    .length.toString()).magenta);
  var loginPayload = {};
  loginPayload[hulken.settings.usernamePostName] = hulken.settings.username;
  loginPayload[hulken.settings.passwordPostName] = hulken.settings.password;

  if (hulken.settings.loginRequired) {
    hulkenAgent.post(hulken.settings.targetUrl + hulken.settings.loginUrl).send(
      loginPayload).end(function(err, res) {
      if (err) {
        console.log('HULKEN login request failed with error: '.inverse.red +
          err.inverse.red);
        process.exit(code = 1);
        return;
      }
      try {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        expect(res.text).to.contain(hulken.settings.loginResponseExpectedText);
        console.log('... user authenticated successfully!'.magenta);

        index++;
        if (index < hulken.agents.length) {
          authenticateAgentsRecursive(index);
        } else {
          executeRequests();
        }


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
    index++;
    if (index < hulken.agents.length) {
      authenticateAgentsRecursive(index);
    } else {
      executeRequests();
    }
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
  var requestInfo = hulken.requestsInfo[index];

  hulken.agents.forEach(function(hulkenAgent) {
    if (!stringIsInArray(hulken.settings.requestsToSkip, requestInfo.path) && !
      stringContainsChar(
        requestInfo.path, hulken.settings.tokensSkippingRequest)) {
      for (var i = 0; i < hulken.settings.timesToRunEachRequest; i++) {
        hulken.requests.push(function() {
          setTimeout(function() {
            if (requestInfo.method.toUpperCase() === 'GET') {
              makeGETrequest(requestInfo, hulkenAgent);
            } else if (requestInfo.method.toUpperCase() === 'POST') {
              makePOSTrequest(requestInfo, hulkenAgent);
            } else {
              throw "HTTP VERB " + requestInfo.method +
                " is not supported";
            }
          }, getRandomWaitTime());
        });
      }
    }
  });
  index++;
  if (index < hulken.requestsInfo.length) {
    prepRequestsRecursive(index);
  }
}

function makePOSTrequest(request, hulkenAgent) {
  if (!request.payload) {
    throw "you have to provide a payload for POST requests!";
  }
  var reqStart = Date.now();
  hulkenAgent.post(hulken.settings.targetUrl + request.path).send(request.payload)
    .end(function(err, res) {
      if (!err) {
        handleRequestResult(res, reqStart, request, hulkenAgent, false, null);
      } else {
        handleRequestResult(res, reqStart, request, hulkenAgent, true, err);
      }
    });
}

function makeGETrequest(request, hulkenAgent) {
  var reqStart = Date.now();
  hulkenAgent.get(hulken.settings.targetUrl + request.path).end(function(err,
    res) {
    if (!err) {
      handleRequestResult(res, reqStart, request, hulkenAgent, false, null);
    } else {
      handleRequestResult(res, reqStart, request, hulkenAgent, true, err);
    }

  });
}

function handleRequestResult(res, reqStart, request, agent, failed, error) {
  var reqStop = Date.now();
  var reqResponseTime = reqStop - reqStart;
  var reqResponseTimeInSeconds = (
    reqResponseTime / 1000);

  if (!failed) {
    if (reqResponseTimeInSeconds > hulken.settings.slowRequestsTimeLimit) {
      hulken.slowRequests.push({
        reqPath: request.path,
        responseTime: reqResponseTimeInSeconds
      });
      console.log((request.method.toUpperCase() + ' ' + request.path +
          ' (by agent ' + agent.id + '/' + hulken.agents.length +
          ') responded in ' +
          reqResponseTimeInSeconds.toString().yellow + ' seconds')
        .toString().grey);
    } else {
      console.log((request.method.toUpperCase() + ' ' + request.path +
          ' (by agent ' + agent.id + '/' + hulken.agents.length +
          ') responded in ' +
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
      addFailedRequest(request, err, reqResponseTimeInSeconds);
      console.log(('GET ' + request.path + ' resulted in ' + err).toString()
        .red);
    }
  } else {
    addFailedRequest(request, error, reqResponseTimeInSeconds);
    console.log((request.method.toUpperCase() + ' ' + request.path +
        ' (by agent ' + agent.id + '/' + hulken.agents.length +
        ') failed with error: ' + error)
      .toString().red);
  }
  requestExecuted(request.path, reqResponseTimeInSeconds);
}

function addFailedRequest(request, error, responseTimeInSeconds) {
  hulken.failedRequests.push({
    reqPath: request.path,
    error: error,
    responseTime: responseTimeInSeconds
  });
}

function executeTestSuite() {
  async.each(hulken.requests, function(request, handleNextItemInAsyncEach) {
    request(); // fire request and immediately continue to the next..
    handleNextItemInAsyncEach();
  }, function(asyncEachError) {
    if (asyncEachError) {
      console.log(asyncEachError);
    }
  });
}

function requestExecuted(reqPath, responseTime) {
  hulken.executedRequests.push({
    reqPath: reqPath,
    responseTime: responseTime
  });

  if (hulken.executedRequests.length === hulken.requests.length) {
    hulken.stop = Date.now();
    console.log('.. all requests have been executed'.magenta);
    var hulkenExecutionTime = (hulken.stop - hulken.start) / 1000;

    var stats = {};
    stats.numberOfHulkenAgents = hulken.settings.numberOfHulkenAgents;
    stats.numberOfConcurrentRequests = hulken.requests.length;
    stats.numberOfUniqueRequests = ((hulken.requests.length /
        hulken.settings.numberOfHulkenAgents) /
      hulken.settings.timesToRunEachRequest);
    stats.totalSecondsElapsed = hulkenExecutionTime;
    stats.avgReqResponseTime = hulken.getAvgResponseTime();
    stats.reqsPerSecond = (hulken.requests.length / hulkenExecutionTime);
    stats.randomRequestWaitTime = '1-6 seconds';
    stats.slowRequests = hulken.slowRequests;
    stats.failedRequests = hulken.failedRequests;
    finsish(hulkenExecutionTime, stats);
  }
}

function finsish(hulkenExecutionTime, stats) {
  printStats(stats);
  if (hulken.settings.angryOnFailedRequest) {
    if (hulkenExecutionTime < hulken.settings.happyTimeLimit && stats.failedRequests
      .length === 0) {
      success(stats);
    } else {
      failure(stats);
    }
  } else {
    if (hulkenExecutionTime < hulken.settings.happyTimeLimit) {
      success(stats);
    } else {
      failure(stats);
    }
  }

}

function success(stats) {
  console.log('');
  console.log('HULKEN PLEASED WITH RESULT, NO ONE NEEDS TO GET HURT TODAY!'
    .bold
    .green);
  console.log('');
  hulken.happyCallback(stats);
}

function failure(stats) {
  console.log('.... BAD RESULT... HULKEN ANGRY!'.bold.red);
  hulken.angryCallback(stats);
}

function printStats(stats) {
  console.log('');
  console.log('**************** RESULT ******************'.bold.cyan);
  console.log('number of concurrent requests ' + stats.numberOfConcurrentRequests
    .toString().magenta);
  console.log('number of hulken agents running ' + stats.numberOfHulkenAgents.toString()
    .magenta);
  console.log('number of unique requests ' + stats.numberOfUniqueRequests.toString()
    .magenta);
  console.log('number of slow requests ' + stats.slowRequests.length.toString()
    .magenta);
  console.log('number of failed requests ' + stats.failedRequests.length.toString()
    .magenta);
  console.log('total seconds elapsed  ' + stats.totalSecondsElapsed.toString()
    .magenta);
  console.log('avg response time (in seconds)  ' + stats.avgReqResponseTime.toFixed(
    4).magenta);
  console.log('req/sec ' + stats.reqsPerSecond.toFixed(2).magenta);
  console.log('random request wait time (in seconds)' + ' 1-6'.magenta);
  console.log('******************************************'.bold.cyan);
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
