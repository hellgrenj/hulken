var colors = require('colors');
var expect = require('expect.js');
var worker = require('../lib/worker');
var hulken = require('../lib/hulken');
var testRequestsArrayParsing = function(next) {
    console.log('..::Hulken Unit tests::..'.bold.inverse.cyan);
    // negative test
    hulken.settings = {};
    hulken.settings.requestsArray = 'not valid json';
    try {
        worker.runTest();
        throw new Error('worker should have thrown an Error due to invalid json input!');
    } catch (ex) {
        expect(ex.toString()).to.contain('could not parse requestsArray, it is not valid JSON');
    }
    var real_authenticateAgentsRecursive = worker._authenticateAgentsRecursive;
    var mocked_authenticateAgentsRecursiveCalledTimes = 0;
    worker._authenticateAgentsRecursive = function() {
        console.log(('setting requests from requestsArray \n' + hulken.settings.requestsArray + '\n').bold.inverse.green);
        mocked_authenticateAgentsRecursiveCalledTimes++;
    };
    // positive test
    hulken.settings = {};
    hulken.settings.requestsArray = '[{"method": "get","path": "/another","expectedTextToExist": "you have reached another page!WrongOnPurpose!"}]';
    hulken.settings.requestsFilePath = 'this will be ignored';
    worker.runTest();
    expect(mocked_authenticateAgentsRecursiveCalledTimes).to.be(1);

    // clean up and reset mocks and spies
    worker._authenticateAgentsRecursive = real_authenticateAgentsRecursive;

    return next();
};
var startIntegrationTests = function() {
    require('./integrations');
};

// run the hulken tests
testRequestsArrayParsing(function unitTestsPassed() {
    console.log('unit tests passed, moving on to integration tests... \n'.bold.inverse.green);
    startIntegrationTests();
});
