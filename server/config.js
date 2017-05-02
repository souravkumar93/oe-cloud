/**
 * 
 * ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 * 
 */

/**
 *
 * NOTE - This is a temporary mechanism to choose between application and evf
 * config files. We will be merging both configurations with application
 * config taking precedence over evf config.
 *
 */
// app config file.
var appconfig = null;
// ev foundation config file.
var config = null;

try {
  appconfig = require('../../../server/config.json');
} catch (e) {
 /* ignored */
}
try {
  config = require('./config.json');
} catch (e) {
/* ignored */
}

if (appconfig) {
  Object.assign(config, appconfig);
}

module.exports = config;

module.exports.gcmServerApiKey = 'AIzaSyCiPcBrRhvBm-lleOAuzXoRM4gyXKAAh1o';
module.exports.appName = 'mBank';
