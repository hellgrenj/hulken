var colors = require('colors');
var expect = require('expect.js');
var testWebServer = require('./testWebServer');

var testStart;
var testStop;
var numberOfHulkenAgentsInTest = 50;

console.log('..::Hulken Integration tests::..'.bold.inverse.cyan);
console.log('');
var runHulkenTestSuite = function() {
  console.log('.. calling on hulken'.bold.inverse.cyan);
  console.log('');


  var hulken = require('../index.js');
  var hulken_options = {
    targetUrl: 'http://127.0.0.1:5656',
    requestsFilePath: './tests/hulkenRequests.json',
    timesToRunEachRequest: 3,
    numberOfHulkenAgents: numberOfHulkenAgentsInTest,
    happyTimeLimit: 10,
    loginRequired: false,
    slowRequestsTimeLimit: 0.5,
    angryOnFailedRequest: false,
    chatty: true,
    happyMessage: "HULKEN HAPPY!",
    angryMessage: "HULKEN ANGRY!",
    minWaitTime: 500,
    maxWaitTime: 3000,
    returnAllRequests: true,
    headers: {
      "key1": "value1",
      "key2": "value2",
      "accept-encoding": "Overriden"
    },
    requestValueLists : {
      usernames: ['john', 'jessica','admin'],
      cities: ['Stockholm', 'London', 'Berlin', 'New York']
    }
  };
  testStart = Date.now();
  hulken.run(function(stats) {
    //console.log(stats);
    verify(stats, hulken_options); // we do not care about the performance of our testWebServer..
  }, function(stats) {
    //console.log(stats);
    verify(stats, hulken_options);
  }, hulken_options);
};

function verify(stats, hulken_options) {
  try {
    expect(stats).to.have.property('numberOfConcurrentRequests');
    expect(stats.numberOfConcurrentRequests).to.be.ok();
    expect(stats).to.have.property('numberOfUniqueRequests');
    expect(stats.numberOfUniqueRequests).to.be.ok();
    expect(stats).to.have.property('totalSecondsElapsed');
    expect(stats.totalSecondsElapsed).to.be.ok();
    expect(stats).to.have.property('avgReqResponseTime');
    expect(stats.avgReqResponseTime).to.be.ok();
    expect(stats).to.have.property('reqsPerSecond');
    expect(stats.reqsPerSecond).to.be.ok();
    expect(stats).to.have.property('randomRequestWaitTime');
    expect(stats.randomRequestWaitTime).to.be.ok();
    expect(stats.randomRequestWaitTime).to.equal((hulken_options.minWaitTime /
      1000) + '-' + (hulken_options.maxWaitTime / 1000));
    expect(stats).to.have.property('numberOfHulkenAgents');
    expect(stats.numberOfHulkenAgents).to.be.ok();
    expect(stats.numberOfConcurrentRequests).to.equal(testWebServer.getReqsReceived());


    expect(stats.numberOfUniqueRequests).to.equal(testWebServer.getReqsReceived() /
      (numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest));
    expect(testWebServer.getStartPageReqsReceived()).to.equal(
      numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest);
    expect(testWebServer.getSomeotherPageReqsReceived()).to.equal(
      numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest);
    expect(testWebServer.getPostsToStartPage()).to.equal(
      numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest);

    //one request is looking for a wrong expectedTextToExist
    expect(stats.failedRequests).to.have.length(numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest);


    veryPostValues();
    verify_returnAllRequests(stats, hulken_options);
    verify_headers(hulken_options);
    verify_randomized_post_values(hulken_options);
    verify_random_list_post_values(hulken_options);

    // if we get here without expect throwing any errors..
    passTest();

  } catch (expectError) {
    printMaxNumberOfConnections();
    console.log('.. Integration tests failed! =('.bold.inverse.red);
    console.log(expectError.stack.toString().bold.inverse.red);
    console.log('');
    process.exit(code = 1);
  }

}

function veryPostValues() {
  var postValues = testWebServer.getPostVars();
  expect(postValues).to.have.property('foo');
  expect(postValues.foo).to.be.ok();
  expect(postValues.foo).to.equal('bar');
}

function verify_returnAllRequests(stats, hulken_options) {
  if (hulken_options.returnAllRequests) {
    expect(stats).to.have.property('allRequests');
    expect(stats.allRequests).to.be.ok();
    expect(stats.allRequests).to.have.length(stats.numberOfConcurrentRequests);
  } else {
    expect(stats).not.to.have.property('allRequests');
  }
}

function verify_headers(hulken_options) {
  if (hulken_options.headers) {
    var headersFromGets = testWebServer.getHeadersFromGets();
    expect(headersFromGets['accept-encoding']).to.be('Overriden');
    for (var key in hulken_options.headers) {
      if (hulken_options.headers.hasOwnProperty(key)) {
        expect(testWebServer.getHeadersFromGets()).to.have.property(key);
        expect(testWebServer.getHeadersFromPosts()).to.have.property(key);
      }
    }
  }
}

function verify_randomized_post_values(hulken_options) {
  var randomPayloads = testWebServer.getRandomPayload();
  expect(randomPayloads.length).to.equal(numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest);
  var uniqueRandomPostValues = [];
  randomPayloads.forEach(function(str) {
    var payload = JSON.parse(str);
    for (var property in payload) {
      expect(uniqueRandomPostValues).to.not.contain(payload[property]);
      uniqueRandomPostValues.push(payload[property]);
    }
  });
}

function verify_random_list_post_values(hulken_options){
  var randomListPayloads = testWebServer.getRandomListPayloadRequests();
  expect(randomListPayloads.length).to.equal(numberOfHulkenAgentsInTest * hulken_options.timesToRunEachRequest);
}

function passTest() {
  printMaxNumberOfConnections();
  testStop = Date.now();
  var testExecutionTime = (testStop - testStart) / 1000;
  console.log('.. Integration tests passed! =)'.bold.inverse.green);
  printExecutionTime();
  console.log('');
  process.exit(code = 0);
}

function printMaxNumberOfConnections() {
  console.log(('maximum number of http connections during test:' +
      testWebServer.getMaxNumberOfConcurrentConnections().toString()).bold.inverse
    .grey);
}

function printExecutionTime() {
  testStop = Date.now();
  var testExecutionTime = (testStop - testStart) / 1000;
  console.log(('.. execution time: ' + testExecutionTime + ' seconds').bold.inverse
    .green);
}

//start the test http server and then start the test
testWebServer.start(runHulkenTestSuite);
