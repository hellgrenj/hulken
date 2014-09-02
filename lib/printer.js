var colors = require('colors');
var hulken = require('./hulken.js');
exports.print = function(str){
  console.log(str);
}
exports.print_if_chatty = function(str) {
  if (hulken.settings.chatty) {
    console.log(str);
  }
}
