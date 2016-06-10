'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('source-map-support').install();

var WebSocket = require('ws');
var uuid = require('uuid');
var Responder = require('./Responder');
var Response = require('./Response');
var logger = require('../common/Logger')('index');

var Client = function () {
  function Client(config) {
    _classCallCheck(this, Client);

    this.config = config;
    this.secret = config.sharedSecret;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    } else {
      this.baseUrl = 'http' + (config.secure ? 's' : '') + '://' + config.hostname + ':' + config.port;
    }
  }

  _createClass(Client, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.ws = new WebSocket(_this.baseUrl.replace(/^http/, 'ws'));
        _this.paths = {};

        function authReject() {
          logger.debug('Rejected: bad secret');
          reject('Bad secret');
        }

        // authorizing
        _this.ws.on('open', function () {
          if (typeof _this.secret !== 'undefined') {
            logger.debug('Sending secert');
            _this.ws.send(_this.secret);
          } else {
            logger.debug('No secret defined'); // mostly for testing
          }
        });

        _this.ws.on('close', authReject);

        _this.ws.on('message', function (rawMessage) {
          var parsed = null;
          try {
            parsed = JSON.parse(rawMessage);
          } catch (e) {
            return;
          }

          if (parsed.connected === true) {
            _this.ws.removeListener('close', authReject);
            resolve(_this);
            return;
          }

          if (_this.paths[parsed.path]) {
            var tid = parsed.tid;
            logger.debug('Received request', parsed.request);
            _this.paths[parsed.path].emit('request', parsed.request);
            _this.paths[parsed.path].emit('requestHandler', parsed.request, new Response(_this, tid));
          }
        });
      });
    }
  }, {
    key: 'sendRes',
    value: function sendRes(tid, response) {
      logger.debug('Sending response', response);
      this.ws.send(JSON.stringify({
        tid: tid,
        response: response
      }));
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      logger.debug('Client closed');
      this.ws.close();
    }
  }, {
    key: 'createListener',
    value: function createListener(path, requestHandler) {
      var _this2 = this;

      var handler = undefined;
      var realPath = undefined;
      if (typeof path === 'function' && typeof requestHandler === 'undefined') {
        handler = path;
      } else {
        handler = requestHandler;
        realPath = path;
      }

      var msg = { action: 'createCallbackUrl' };
      if (typeof realPath !== 'undefined') {
        msg.path = realPath;
      }
      return this.sendRecv(msg).then(function (message) {
        logger.debug('Received callback url ' + message.path);
        var responder = new Responder(_this2, message.path);
        _this2.paths[message.path] = responder;
        if (typeof handler === 'function') {
          responder.handler = handler;
        }
        responder.on('requestHandler', function (req, res) {
          responder.handler(req, res);
        });
        return responder;
      });
    }
  }, {
    key: 'sendRecv',
    value: function sendRecv(msg) {
      var _this3 = this;

      var tid = uuid.v4();
      var message = msg;
      message.tid = tid;

      return new Promise(function (resolve, reject) {
        var timeout = null;

        var listener = function listener(rawMessage) {
          var parsed = null;
          try {
            parsed = JSON.parse(rawMessage);
          } catch (e) {
            return;
          }

          if (parsed.tid !== tid) {
            return;
          }

          _this3.ws.removeListener('message', listener);
          clearTimeout(timeout);

          if (message.error) {
            logger.debug('Received error', parsed);
            reject(parsed);
            return;
          }

          logger.debug('Received message', parsed);
          resolve(parsed);
        };

        timeout = setTimeout(function () {
          _this3.ws.removeListener('message', listener);
          reject(new Error('timed out'));
        }, 2000);

        _this3.ws.on('message', listener);

        logger.debug('Sending message', message);
        _this3.ws.send(JSON.stringify(message));
      });
    }
  }]);

  return Client;
}();

module.exports = Client;
//# sourceMappingURL=index.js.map