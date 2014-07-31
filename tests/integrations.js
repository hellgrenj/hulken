var colors = require('colors');
var expect = require('expect.js');
var testWebServer = require('./testWebServer');

var testStart;
var testStop;
var numberOfHulkenAgentsInTest = 50;

console.log('..::Hulken Integration tests::..'.bold.inverse.cyan);
console.log('');
var runHulkenTestSuite = function(){
  console.log('.. calling on hulken'.bold.inverse.cyan);
  console.log('');


  var hulken = require('../hulken.js');
  var hulken_options = {
    targetUrl: 'http://127.0.0.1:5656',
    requestsFilePath: './tests/hulkenRequests.json',
    timesToRunEachRequest: 1,
    numberOfHulkenAgents: numberOfHulkenAgentsInTest,
    happyTimeLimit: 10,
    slowRequestsTimeLimit: 0.5,
    angryOnFailedRequest: false
  };
  testStart = Date.now();
  hulken.run(function(stats){
      console.log(stats);
      verify(stats); // we do not care about the performance of our testWebServer..
  }, function(stats) {

      verify(stats);
  }, hulken_options);
};

function verify(stats){
  try{
    expect(stats).to.exist;
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
    expect(stats).to.have.property('numberOfHulkenAgents');
    expect(stats.numberOfHulkenAgents).to.be.ok();

    expect(stats.numberOfConcurrentRequests).to.equal(testWebServer.getReqsReceived());

    //since timesToRunEachRequest is set to 1
    expect(stats.numberOfUniqueRequests).to.equal(testWebServer.getReqsReceived() / numberOfHulkenAgentsInTest);
    expect(testWebServer.getStartPageReqsReceived()).to.equal(numberOfHulkenAgentsInTest);
    expect(testWebServer.getSomeotherPageReqsReceived()).to.equal(numberOfHulkenAgentsInTest);
    expect(testWebServer.getPostsToStartPage()).to.equal(numberOfHulkenAgentsInTest);
    expect(stats.failedRequests).to.have.length(numberOfHulkenAgentsInTest); //one request is looking for a wrong expectedTextToExist

    var postValues = testWebServer.getPostVars();
    expect(postValues).to.have.property('foo');
    expect(postValues.foo).to.be.ok();
    expect(postValues.foo).to.equal('bar');

    // if we get here without expect throwing any errors..
    passTest();
  }catch(expectError){
    printMaxNumberOfConnections();
    console.log('.. Integration tests failed! =('.bold.inverse.red);
    console.log(expectError.stack.toString().bold.inverse.red);
    console.log('');
    process.exit(code = 1);
  }

}
function passTest(){
  printMaxNumberOfConnections();
  testStop = Date.now();
  var testExecutionTime = (testStop - testStart)/ 1000;
  console.log('.. Integration tests passed! =)'.bold.inverse.green);
  printExecutionTime();
  console.log('');
  process.exit(code = 0);
}
function printMaxNumberOfConnections(){
  console.log(('maximum number of http connections during test:' +
  testWebServer.getMaxNumberOfConcurrentConnections().toString()).bold.inverse.grey);
}
function printExecutionTime(){
  testStop = Date.now();
  var testExecutionTime = (testStop - testStart)/ 1000;
  console.log(('.. execution time: ' + testExecutionTime + ' seconds').bold.inverse.green);
}

//start the test http server and then start the test
testWebServer.start(runHulkenTestSuite);
