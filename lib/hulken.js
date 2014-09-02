//  internal deps
var worker = require('./worker.js');
var printer = require('./printer.js');

var hulken = this;
hulken.smash = function(error, success, options) {
  hulken._init(error, success, options);
  worker.runTest();
};
hulken.getAvgResponseTime = function() {
  var totalRespTime = 0;
  for (var i = 0; i < hulken.executedRequests.length; i++) {
    totalRespTime += hulken.executedRequests[i].responseTime;
  }
  return (totalRespTime / hulken.requests.length);
}
hulken._init = function(error, success, options) {
  hulken.settings = {};
  hulken.agents = [];
  hulken.requests = [];
  hulken.executedRequests = [];
  hulken.failedRequests = [];
  hulken.slowRequests = [];
  hulken.angryCallback = error;
  hulken.happyCallback = success;
  hulken._setDefaults();
  hulken._overrideDefaultsWithOptions(options);
}

hulken._setDefaults = function() {
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
  hulken.settings.chatty = true;
  hulken.settings.happyMessage =
    "HULKEN PLEASED WITH RESULT, NO ONE NEEDS TO GET HURT TODAY!";
  hulken.settings.angryMessage = "....BAD RESULT...HULKEN ANGRY!";
  hulken.settings.minWaitTime = 1000;
  hulken.settings.maxWaitTime = 6000;
}
hulken._overrideDefaultsWithOptions = function(options) {
  if (options) {
    if (options.timesToRunEachRequest) {
      hulken.settings.timesToRunEachRequest = options.timesToRunEachRequest;
      printer.print('number of times to repeat each request set to '.cyan +
        hulken.settings.timesToRunEachRequest.toString().bold.magenta);
    }
    if (options.targetUrl) {
      hulken.settings.targetUrl = options.targetUrl;
      printer.print('target url set to '.cyan + hulken.settings.targetUrl.bold.magenta);
    }
    if (options.requestsFilePath) {
      hulken.settings.requestsFilePath = options.requestsFilePath;
      printer.print('request file path (including file name) set to '.cyan +
        hulken.settings.requestsFilePath.bold.magenta);
    }
    if (options.tokensSkippingRequest) {
      hulken.settings.tokensSkippingRequest = options.tokensSkippingRequest;
      printer.print(
        'the following characters (in an url) will cause a request to be skipped '
        .cyan + hulken.settings.tokensSkippingRequest.toString().bold.magenta);
    }
    if (options.requestsToSkip) {
      hulken.settings.requestsToSkip = options.requestsToSkip;
      printer.print('requests to skip set to '.cyan + hulken.settings.requestsToSkip
        .toString()
        .bold.magenta);
    }
    if (options.loginRequired !== null && options.loginRequired !== undefined) {
      hulken.settings.loginRequired = options.loginRequired;
      printer.print('loginRequired set to '.cyan + hulken.settings.loginRequired
        .toString()
        .bold
        .magenta);
    }
    if (options.username) {
      hulken.settings.username = options.username;
      printer.print('username set to '.cyan + hulken.settings.username.bold.magenta);
    }
    if (options.password) {
      hulken.settings.password = options.password;
      printer.print(
        'password set ... check options file, im not gonna display it here! =) '
        .cyan);
    }
    if (options.loginUrl) {
      hulken.settings.loginUrl = options.loginUrl;
      printer.print('loginUrl set to '.cyan + hulken.settings.loginUrl.bold.magenta);
    }
    if (options.loginResponseExpectedText) {
      hulken.settings.loginResponseExpectedText = options.loginResponseExpectedText;
      printer.print('loginResponseExpectedText set to '.cyan +
        hulken.settings.loginResponseExpectedText.bold.magenta);
    }
    if (options.happyTimeLimit) {
      hulken.settings.happyTimeLimit = options.happyTimeLimit;
      printer.print('happyTimeLimit set to '.cyan + hulken.settings.happyTimeLimit
        .toString().bold
        .magenta);
    }
    if (options.usernamePostName) {
      hulken.settings.usernamePostName = options.usernamePostName;
      printer.print('usernamePostName set to '.cyan +
        hulken.settings.usernamePostName.bold.magenta);
    }
    if (options.passwordPostName) {
      hulken.settings.passwordPostName = options.passwordPostName;
      printer.print('passwordPostName set to '.cyan +
        hulken.settings.passwordPostName.bold.magenta);
    }
    if (options.numberOfHulkenAgents) {
      hulken.settings.numberOfHulkenAgents = options.numberOfHulkenAgents;
      printer.print('numberOfHulkenAgents set to '.cyan +
        hulken.settings.numberOfHulkenAgents.toString().bold.magenta);
    }
    if (options.slowRequestsTimeLimit) {
      hulken.settings.slowRequestsTimeLimit = options.slowRequestsTimeLimit;
      printer.print('slowRequestsTimeLimit set to '.cyan +
        hulken.settings.slowRequestsTimeLimit.toString().bold.magenta);
    }
    if (options.angryOnFailedRequest) {
      hulken.settings.angryOnFailedRequest = options.angryOnFailedRequest;
      printer.print('angryOnFailedRequest set to '.cyan +
        hulken.settings.angryOnFailedRequest.toString().bold.magenta);
    }
    if (options.chatty !== null && options.chatty !== undefined) {
      hulken.settings.chatty = options.chatty;
      printer.print('chatty set to '.cyan +
        hulken.settings.chatty.toString().bold.magenta);
    }
    if (options.happyMessage) {
      hulken.settings.happyMessage = options.happyMessage;
      printer.print('happyMessage set to '.cyan +
        hulken.settings.happyMessage.toString().bold.magenta);
    }
    if (options.angryMessage) {
      hulken.settings.angryMessage = options.angryMessage;
      printer.print('angryMessage set to '.cyan +
        hulken.settings.angryMessage.toString().bold.magenta);
    }
    if (options.minWaitTime) {
      hulken.settings.minWaitTime = options.minWaitTime;
      printer.print('minWaitTime set to '.cyan +
        hulken.settings.minWaitTime.toString().bold.magenta);
    }
    if (options.maxWaitTime) {
      hulken.settings.maxWaitTime = options.maxWaitTime;
      printer.print('maxWaitTime set to '.cyan +
        hulken.settings.maxWaitTime.toString().bold.magenta);
    }
  }
}

module.exports = hulken;
