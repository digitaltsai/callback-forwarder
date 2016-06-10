'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = require('uuid');

var logger = require('../common/Logger')('CallbackClient');

var CallbackClient = function () {
  function CallbackClient(callbackServer, ws) {
    var _this = this;

    _classCallCheck(this, CallbackClient);

    this.callbackServer = callbackServer;
    this.ws = ws;
    this.id = uuid.v4();
    this.paths = {};

    this.ws.on('message', function (message) {
      _this.parseMessage(message);
    });
  }

  _createClass(CallbackClient, [{
    key: 'parseMessage',
    value: function parseMessage(message) {
      var _this2 = this;

      var parsed = void 0;
      try {
        parsed = JSON.parse(message);
      } catch (e) {
        logger.error(e);
        this.sendError(e);
        return;
      }

      logger.debug('Received message:', message);

      if (!parsed.tid) {
        this.sendError(new Error('No transaction ID'));
      }

      switch (parsed.action) {
        case 'createCallbackUrl':
          {
            // tell the server to forward a new url
            this.createCallbackUrl(parsed.path).then(function (fullPath) {
              logger.debug('Sending callback url ' + fullPath);
              _this2.ws.send(JSON.stringify({
                tid: parsed.tid,
                path: fullPath
              }));
            }).catch(function (err) {
              _this2.ws.send(JSON.stringify({
                tid: parsed.tid,
                error: err.message
              }));
            });
            break;
          }
        default:
          {
            this.ws.send(JSON.stringify({
              error: 'Invalid action specified'
            }));
            break;
          }
      }
    }
  }, {
    key: 'createCallbackUrl',
    value: function createCallbackUrl(pathInput) {
      var _this3 = this;

      if (!pathInput || pathInput[0] !== '/') {
        Promise.reject('Invalid path');
      }

      var path = pathInput || '/' + this.id + '/' + uuid.v4();
      return this.callbackServer.createCallbackUrl(path, this).then(function () {
        _this3.paths[path] = true;
        return path;
      });
    }
  }, {
    key: 'deleteCallbackUrl',
    value: function deleteCallbackUrl(path) {
      delete this.paths[path];
      this.callbackServer.deleteCalbackUrl(path);
    }

    // this will just ask the client for a response

  }, {
    key: 'askClientForResponse',
    value: function askClientForResponse(path, request) {
      var _this4 = this;

      var tid = uuid.v4();
      return new Promise(function (resolve, reject) {
        var timeout = null;

        var pathListener = function pathListener(rawMessage) {
          var message = null;
          try {
            message = JSON.parse(rawMessage);
          } catch (e) {
            logger.error(e);
            return;
          }

          if (message.tid !== tid) {
            return;
          }
          logger.debug('Received relayed message');
          _this4.ws.removeListener('message', pathListener);
          clearTimeout(timeout);
          resolve(message.response);
        };

        timeout = setTimeout(function () {
          reject(new Error('Did not receive response in time'));
          _this4.ws.removeListener('message', pathListener);
        }, 5000);

        _this4.ws.on('message', pathListener);

        _this4.ws.send(JSON.stringify({
          tid: tid,
          path: path,
          request: request
        }));
      });
    }
  }]);

  return CallbackClient;
}();

module.exports = CallbackClient;
//# sourceMappingURL=CallbackClient.js.map