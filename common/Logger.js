'use strict';

const winston = require('winston');
const moment = require('moment-timezone');

function LoggerFactory(fileName) {
  const consoleTransport = new (winston.transports.Console)({
    timestamp: () => moment().tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss,SSS'),
    label: fileName,
    colorize: true,
    level: process.env.LOGLEVEL || 'error',
  });

  const logger = new (winston.Logger)({
    transports: [consoleTransport],
  });

  return logger;
}

module.exports = LoggerFactory;
