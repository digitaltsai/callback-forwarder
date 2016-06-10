'use strict';

var winston = require('winston');
var moment = require('moment-timezone');

function LoggerFactory(fileName) {
  var consoleTransport = new winston.transports.Console({
    timestamp: function timestamp() {
      return moment().tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss,SSS');
    },
    label: fileName,
    colorize: true,
    level: process.env.LOGLEVEL || 'error'
  });

  var logger = new winston.Logger({
    transports: [consoleTransport]
  });

  return logger;
}

module.exports = LoggerFactory;
//# sourceMappingURL=Logger.js.map