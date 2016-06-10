'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Response = function () {
  function Response(client, tid) {
    _classCallCheck(this, Response);

    this.res = {
      status: 200
    };
    this.client = client;
    this.tid = tid;
  }

  _createClass(Response, [{
    key: 'status',
    value: function status(_status) {
      this.res.status = _status;
      return this;
    }
  }, {
    key: 'header',
    value: function header(field, value) {
      if ((typeof field === 'undefined' ? 'undefined' : _typeof(field)) === 'object') {
        this.res.headers = field;
      } else {
        this.res.headers = _defineProperty({}, field, value);
      }
      return this;
    }
  }, {
    key: 'json',
    value: function json(str) {
      try {
        return this.end(JSON.stringify(str));
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }, {
    key: 'end',
    value: function end(str) {
      this.res.body = this.res.body || str;
      this.client.sendRes(this.tid, this.res);
      return this;
    }
  }, {
    key: 'send',
    value: function send(str) {
      return this.end(str);
    }
  }, {
    key: 'sendStatus',
    value: function sendStatus(status) {
      return this.status(status).end();
    }
  }]);

  return Response;
}();

module.exports = Response;
//# sourceMappingURL=Response.js.map