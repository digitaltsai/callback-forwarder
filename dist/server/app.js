'use strict';

require('source-map-support').install();

var config = require('../config');

var CallbackServer = require('./CallbackServer');

new CallbackServer(config).start();
//# sourceMappingURL=app.js.map