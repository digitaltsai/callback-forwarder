'use strict';
require('source-map-support').install();

const config = require('../config');

const CallbackServer = require('./CallbackServer');

new CallbackServer(config).start();
