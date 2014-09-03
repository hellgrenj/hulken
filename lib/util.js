//  external deps
var fs = require('fs');
//  internal deps
var hulken = require('./hulken.js');
var printer = require('./printer.js');

exports.getRandomWaitTime = function() {
  var min = hulken.settings.minWaitTime;
  var max = hulken.settings.maxWaitTime;
  var randomWaitTime = Math.random() * (max - min) + min;
  return randomWaitTime;
}

exports.stringContainsChar = function(str, tokens) {
  for (var i = 0; i < str.length; i++) {
    for (var j = 0; j < tokens.length; j++) {
      if (str[i] === tokens[j]) {
        return true;
      }
    }
  }
  return false;
}

exports.stringIsInArray = function(strArray, str) {
  for (var i = 0; i < strArray.length; i++) {
    if (strArray[i] == str) {
      return true;
    }
  }
  return false;
}
exports.createExampleOptions = function() {
  var appUrl = process.argv[3];
  if (!appUrl) {
    printer.print('you have to provide the url!'.red.inverse);
  } else {
    var hulken_options = {
      targetUrl: appUrl,
      requestsFilePath: './hulkenRequestsFile.json',
      timesToRunEachRequest: 10,
      numberOfHulkenAgents: 10,
      happyTimeLimit: 10,
      slowRequestsTimeLimit: 0.5,
      angryOnFailedRequest: true,
      chatty: true,
      happyMessage: "HULKEN PLEASED, YOU MAY CONTINUE WITH YOUR DAY!",
      angryMessage: "HULKEN ANGRY! HULKEN SMASH!",
      minWaitTime: 500,
      maxWaitTime: 2000,
      tokensSkippingRequest: [':', '{', '}']
    };
    fs.writeFile('./options.json', JSON.stringify(
      hulken_options), function(err) {
      if (err) {
        printer.print(err.toString().red.inverse);
      } else {
        printer.print('\n an example options.json was created:'.green.inverse);
        printer.print('(please review the requestsFilePath)'.white.inverse +
          '\n');
        printer.print(JSON.stringify(hulken_options, null, 4) + '\n');
        printer.print(
          'see other settings you can override and their default values at:'.white
          .inverse);
        printer.print(
          'https://github.com/hellgrenj/hulken#usage-as-a-library'.white
          .inverse + '\n');
      }
    });
  }
}
