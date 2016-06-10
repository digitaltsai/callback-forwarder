'use strict';

const util = require('util');

const EventEmitter = require('eventemitter3');

function Responder(client, path) {
  EventEmitter.apply(this);
  this.uri = `${client.baseUrl}${path}`;
  this.path = path;
  this.handler = function handler(req, res) {
    res.end();
  };
}

util.inherits(Responder, EventEmitter);

Responder.prototype.setHandler = function setHandler(func) {
  this.handler = func;
};

module.exports = Responder;
