//  external deps
var superAgent = require('superagent');
var expect = require('expect.js');
var path = require('path');
var fs = require('fs');
//  internal deps
var printer = require('./printer.js');
var hulken = require('./hulken.js');
var util = require('./util.js');
var worker = this;

exports.runTest = function () {
    worker._prepareAgents();
    hulken.start = Date.now();
    printer.print('\n\n ..::HULKEN SMASH::.. \n\n'.bold.green);
    if (hulken.settings.requestsArray) {
        try {
            hulken.requestsInfo = JSON.parse(hulken.settings.requestsArray);
        } catch (err) {
            var errorMessage = 'could not parse requestsArray, it is not valid JSON';
            printer.print((errorMessage + err.toString()).red);
            throw Error(errorMessage);

        }
        return worker._authenticateAgentsRecursive(0, worker._executeRequests);
    }
    fs.readFile(hulken.settings.requestsFilePath, 'utf-8', function (err, data) {
        if (err) throw err;
        hulken.requestsInfo = JSON.parse(data);
        return worker._authenticateAgentsRecursive(0, worker._executeRequests);
    });


};
worker._prepareAgents = function () {
    for (var i = 0; i < hulken.settings.numberOfHulkenAgents; i++) {
        var agent = superAgent.agent();
        agent.id = (i + 1);
        hulken.agents.push(agent);
    }
};
worker._authenticateAgentsRecursive = function (index, next) {
    if (!index) {
        index = 0;
    }
    var hulkenAgent = hulken.agents[index];
    printer.print_if_chatty(('initiating agent ' + (index + 1).toString() +
        ' of ' + hulken.agents.length.toString()).magenta);

    var loginPayload = {};
    loginPayload[hulken.settings.usernamePostName] = hulken.settings.username;
    loginPayload[hulken.settings.passwordPostName] = hulken.settings.password;

    if (hulken.settings.loginRequired) {
        hulkenAgent.post(hulken.settings.targetUrl + hulken.settings.loginUrl).set(
            hulken.settings.headers).send(
                loginPayload).end(function (err, res) {
                    if (err) {
                        printer.print(('HULKEN login request failed with error: ' + err).red
                            .inverse);
                        process.exit(code = 1);
                        return;
                    }
                    try {
                        expect(res).to.exist;
                        expect(res.status).to.equal(200);
                        expect(res.text).to.contain(hulken.settings.loginResponseExpectedText);
                        printer.print_if_chatty('... user authenticated successfully!'.magenta);
                        worker._move_on(index, next);
                    } catch (err) {
                        printer.print(('login failed: ' + err.toString()).yellow);
                        printer.print(
                            'HULKEN needs a successful login to execute the requests...'.inverse
                                .red);
                        process.exit(code = 1);
                    }

                });
    } else {
        printer.print_if_chatty(
            '... no login required, continuing with anonymous user'.cyan);
        worker._move_on(index, next);
    }
};
worker._move_on = function (index, next) {
    index++;
    if (index < hulken.agents.length) {
        worker._authenticateAgentsRecursive(index, next);
    } else {
        next();
    }
};

worker._executeRequests = function () {
    printer.print('... starting to execute requests'.magenta);
    worker._prepRequestsRecursive();
    worker._executeTestSuite();
};

worker._prepRequestsRecursive = function (index) {
    if (!index) {
        index = 0;
    }
    var requestInfo = hulken.requestsInfo[index];
    hulken.agents.forEach(function (hulkenAgent) {
        if (!util.stringIsInArray(hulken.settings.requestsToSkip, requestInfo
            .path) &&
            !util.stringContainsChar(
                requestInfo.path, hulken.settings.tokensSkippingRequest)) {
            for (var i = 0; i < hulken.settings.timesToRunEachRequest; i++) {

                (function (req) {
                    hulken.requests.push(function () {
                        setTimeout(function () {
                            if (req.method.toUpperCase() === 'GET') {
                                worker._makeGETrequest(req, hulkenAgent);
                            } else if (req.method.toUpperCase() === 'POST') {
                                worker._makePOSTrequest(req, hulkenAgent);
                            } else {
                                throw "HTTP VERB " + req.method +
                                " is not supported";
                            }
                        }, util.getRandomWaitTime());
                    });
                }(util.getCloneOfObject(requestInfo)));
            }
        }
    });
    index++;
    if (index < hulken.requestsInfo.length) {
        worker._prepRequestsRecursive(index, hulken);
    }
};

worker._makePOSTrequest = function (request, hulkenAgent) {
    if (!request.payload) {
        throw "you have to provide a payload for POST requests!";
    }
    worker._setPostValues(request);
    var reqStart = Date.now();
    hulkenAgent.post(hulken.settings.targetUrl + request.path).send(request.payload)
        .set(hulken.settings
            .headers)
        .end(function (err, res) {
            if (!err) {
                worker._handleRequestResult(res, reqStart, request, hulkenAgent,
                    false, null);
            } else {
                worker._handleRequestResult(res, reqStart, request, hulkenAgent,
                    true,
                    err);
            }
        });
};

worker._setPostValues = function (request) {
    for (var property in request.payload) {
        if (request.payload.hasOwnProperty(property)) {
            var propertyValue = request.payload[property];
            if (typeof (propertyValue) === 'string' && propertyValue.substring(0, 2) == '::') {
                var expression = propertyValue.substring(2);

                var propertyValueAsArrayOfStrings = expression.split(' ');
                var command = propertyValueAsArrayOfStrings[0];

                switch (command) {
                    case 'random':
                        var valueType = propertyValueAsArrayOfStrings[1];
                        var numberOfChars = propertyValueAsArrayOfStrings[2];
                        if (!valueType || !numberOfChars) {
                            throw 'bad syntax for command random (syntax ::random <valuetype> <numberOfChars>) (example ::random letters 10)';
                        }
                        if (valueType == 'letters') {
                            request.payload[property] = util.getRandomStringOfLetters(
                                numberOfChars);
                        } else if (valueType == 'numbers') {
                            request.payload[property] = util.getRandomStringOfNumbers(
                                numberOfChars);
                        } else if (valueType == 'lettersandnumbers') {
                            request.payload[property] = util.getRandomStringOfLettersAndNumbers(
                                numberOfChars);
                        } else {
                            throw 'unknown value type ' + valueType;
                        }

                        break;
                    case 'randomList':
                        var requestValueListKey = propertyValueAsArrayOfStrings[1];
                        if (!requestValueListKey) {
                            throw 'bad syntax for command randomList (syntax ::randomList <nameOfRequestValueList>) (example ::randomList usernames)';
                        }
                        var requestValueList = hulken.settings.requestValueLists[requestValueListKey];
                        if (!requestValueList) {
                            throw 'no value list named ' + requestValueListKey + ' was found check your options';
                        }
                        request.payload[property] = util.getRandomValueInArray(
                            requestValueList);
                        break;
                    default:
                        throw 'unknown command ' + command;
                }
            } //else do nothing with the value..
        }
    }
};

worker._makeGETrequest = function (request, hulkenAgent) {
    var reqStart = Date.now();
    hulkenAgent.get(hulken.settings.targetUrl + request.path).set(hulken.settings
        .headers).end(function (err,
            res) {
            if (!err) {
                worker._handleRequestResult(res, reqStart, request, hulkenAgent,
                    false,
                    null);
            } else {
                worker._handleRequestResult(res, reqStart, request, hulkenAgent,
                    true,
                    err);
            }

        });
};

worker._handleRequestResult = function (res, reqStart, request, agent, failed,
    error) {
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
            printer.print_if_chatty((request.method.toUpperCase() + ' ' + request.path +
                ' (by agent ' + agent.id + '/' + hulken.agents.length +
                ') responded in ' +
                reqResponseTimeInSeconds.toString().yellow + ' seconds')
                .toString().grey);
        } else {
            printer.print_if_chatty((request.method.toUpperCase() + ' ' + request.path +
                ' (by agent ' + agent.id + '/' + hulken.agents.length +
                ') responded in ' +
                reqResponseTimeInSeconds.toString().green + ' seconds')
                .toString().grey);
        }

        try {
            expect(res).to.exist;
            if (request.expectedStatusCode) {
                expect(res.status).to.equal(request.expectedStatusCode);
            } else {
                expect(res.status).to.equal(200);
            }

            if (request.expectedTextToExist) {
                expect(res.text).to.contain(request.expectedTextToExist);
            }
        } catch (err) {
            worker._addFailedRequest(request, err, reqResponseTimeInSeconds);
            printer.print_if_chatty(('GET ' + request.path + ' resulted in ' + err)
                .toString()
                .red);
        }
    } else {
        worker._addFailedRequest(request, error, reqResponseTimeInSeconds);
        printer.print_if_chatty((request.method.toUpperCase() + ' ' + request.path +
            ' (by agent ' + agent.id + '/' + hulken.agents.length +
            ') failed with error: ' + error)
            .toString().red);
    }
    worker._requestExecuted(request.path, reqResponseTimeInSeconds, reqStart);
};

worker._addFailedRequest = function (request, error, responseTimeInSeconds) {
    hulken.failedRequests.push({
        reqPath: request.path,
        error: error,
        responseTime: responseTimeInSeconds
    });
};

worker._executeTestSuite = function () {
    hulken.requests.forEach(function (execute) {
        execute();
    });
};

worker._ensureDateIntervalTwoDigits = function (di) {
    if (di < 10) {
        return '0' + di;
    }
    return di;
};
worker._requestExecuted = function (reqPath, responseTime, reqStart) {
    var sentTime = new Date(reqStart);
    hulken.executedRequests.push({
        reqPath: reqPath,
        responseTime: responseTime,
        sent: worker._ensureDateIntervalTwoDigits(sentTime.getHours()) + ':' +
            worker._ensureDateIntervalTwoDigits(sentTime.getMinutes()) + ':' +
            worker._ensureDateIntervalTwoDigits(sentTime.getSeconds())
    });

    if (hulken.executedRequests.length === hulken.requests.length) {
        hulken.stop = Date.now();
        printer.print('.. all requests have been executed'.magenta);
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
        stats.randomRequestWaitTime = (hulken.settings.minWaitTime / 1000) + '-' +
            (hulken.settings.maxWaitTime / 1000);
        stats.slowRequests = hulken.slowRequests;
        stats.failedRequests = hulken.failedRequests;
        if (hulken.settings.returnAllRequests) {
            stats.allRequests = hulken.executedRequests;
        }
        worker._finsish(hulkenExecutionTime, stats);
    }
};
worker._printLoadDistribution = function () {
    var loadDistribution = {};
    hulken.executedRequests.forEach(function (request) {
        if (loadDistribution[request.sent]) {
            loadDistribution[request.sent] += 1;
        } else {
            loadDistribution[request.sent] = 1;
        }
    });
    printer.print('\n');
    printer.print('LOAD DISTRIBUTION'.bold.cyan);
    printer.print('hh:mm:ss reqs sent'.cyan.italic);
    for (var timeStamp in loadDistribution) {
        printer.print(timeStamp + ' ' + loadDistribution[timeStamp].toString().cyan);
    }
    printer.print('\n');
};
worker._finsish = function (hulkenExecutionTime, stats) {
    worker._printStats(stats);
    if (hulken.settings.printLoadDistribution === true) {
        worker._printLoadDistribution();
    }

    if (hulken.settings.angryOnFailedRequest) {
        if (hulkenExecutionTime < hulken.settings.happyTimeLimit && stats.failedRequests
            .length === 0) {
            worker._success(stats);
        } else {
            worker._failure(stats);
        }
    } else {
        if (hulkenExecutionTime < hulken.settings.happyTimeLimit) {
            worker._success(stats);
        } else {
            worker._failure(stats);
        }
    }

};
worker._success = function (stats) {
    printer.print('\n' + hulken.settings.happyMessage.bold.green + '\n');
    hulken.happyCallback(stats);
};

worker._failure = function (stats) {
    printer.print(hulken.settings.angryMessage.bold.red);
    hulken.angryCallback(stats);
};

worker._printStats = function (stats) {
    printer.print('\n**************** RESULT ******************'.bold.cyan);
    printer.print('number of concurrent requests ' + stats.numberOfConcurrentRequests
        .toString().magenta);
    printer.print('number of hulken agents running ' + stats.numberOfHulkenAgents
        .toString()
        .magenta);
    printer.print('number of unique requests ' + stats.numberOfUniqueRequests.toString()
        .magenta);
    printer.print('number of slow requests ' + stats.slowRequests.length.toString()
        .magenta);
    printer.print('number of failed requests ' + stats.failedRequests.length.toString()
        .magenta);
    printer.print('total seconds elapsed  ' + stats.totalSecondsElapsed.toString()
        .magenta);
    printer.print('avg response time (in seconds)  ' + stats.avgReqResponseTime
        .toFixed(
            4).magenta);
    printer.print('req/sec ' + stats.reqsPerSecond.toFixed(2).magenta);
    printer.print('random request wait time (in seconds) ' + stats.randomRequestWaitTime
        .magenta);
    printer.print('******************************************'.bold.cyan);
};
