'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('source-map-support').install();

var http = require('http');
var url = require('url');

var CallbackClient = require('./CallbackClient');
var WebSocketHandler = require('./WebSocketHandler');

var logger = require('../common/Logger')('CallbackServer');

var CallbackServer = function () {
  function CallbackServer(config) {
    var _this = this;

    _classCallCheck(this, CallbackServer);

    this.config = config;
    this.paths = {};
    this.secret = config.sharedSecret;

    var server = http.createServer();
    this.server = server;

    var wsh = new WebSocketHandler(this); // eslint-disable-line

    server.on('request', function (req, res) {
      var parsedUrl = url.parse(req.url);

      if (parsedUrl.path === '/server/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          pathCount: _this.paths.length
        }));
        return;
      }

      if (!_this.paths[parsedUrl.path]) {
        logger.debug('No matching path');
        res.writeHead(404);
        res.end();
        return;
      }

      var body = [];
      req.on('data', function (chunk) {
        body.push(chunk);
      }).on('end', function () {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        var client = _this.paths[parsedUrl.path];

        if (!client) {
          logger.debug('Lost connection to client before request completed');
          return;
        }

        var request = {
          method: req.method,
          headers: req.headers,
          uri: req.url,
          body: body
        };

        var path = url.parse(req.url).path;

        logger.debug('Relaying request', request);
        client.askClientForResponse(path, request).then(function (clientRes) {
          logger.debug('Relaying response', clientRes);
          res.writeHead(clientRes.status, clientRes.headers);
          res.end(clientRes.body);
        }).catch(function (err) {
          logger.error(err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(err.message);
        });
      });
    });
  }

  _createClass(CallbackServer, [{
    key: 'start',
    value: function start() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.server.listen(_this2.config.port, _this2.config.hostname, function (err) {
          if (err) {
            logger.error(err);
            reject(err);
            return;
          }
          logger.debug('Server started on ' + _this2.config.hostname + ':' + _this2.config.port); // eslint-disable-line
          resolve();
        });
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.server.close();
    }
  }, {
    key: 'createClient',
    value: function createClient(ws) {
      var callbackClient = new CallbackClient(this, ws);
      logger.debug('Client created ' + callbackClient.id);
      return callbackClient;
    }
  }, {
    key: 'createCallbackUrl',
    value: function createCallbackUrl(path, client) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (_this3.paths[path]) {
          var err = new Error('already has a path');
          logger.error(err);
          reject(err);
          return;
        }
        logger.debug('Created callback url ' + path);
        _this3.paths[path] = client;
        resolve();
      });
    }
  }, {
    key: 'deleteCallbackUrl',
    value: function deleteCallbackUrl(path) {
      delete this.paths[path];
    }
  }, {
    key: 'deleteClient',
    value: function deleteClient(callbackClient) {
      logger.debug('Deleting client ' + callbackClient.id);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(callbackClient.paths)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var path = _step.value;

          delete this.paths[path];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);

  return CallbackServer;
}();

module.exports = CallbackServer;
//# sourceMappingURL=CallbackServer.js.map