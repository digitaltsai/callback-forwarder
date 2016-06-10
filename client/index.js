'use strict';
require('source-map-support').install();

const WebSocket = require('ws');
const uuid = require('uuid');
const Responder = require('./Responder');
const Response = require('./Response');
const logger = require('../common/Logger')('index');

class Client {
  constructor(config) {
    this.config = config;
    this.secret = config.sharedSecret;
    this.connected = false;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    } else {
      this.baseUrl = `http${config.secure ? 's' : ''}://${config.hostname}:${config.port}`;
    }
    this.queue = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.baseUrl.replace(/^http/, 'ws'));
      this.paths = {};

      function authReject() {
        logger.debug('Rejected: bad secret');
        reject('Bad secret');
      }

      // authorizing
      this.ws.on('open', () => {
        if (typeof this.secret !== 'undefined') {
          logger.debug('Sending secert');
          this.ws.send(this.secret);
        } else {
          logger.debug('No secret defined'); // mostly for testing
        }
      });

      this.ws.on('close', authReject);

      this.ws.on('message', (rawMessage) => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawMessage);
        } catch (e) {
          return;
        }

        if (parsed.connected === true) {
          this.ws.removeListener('close', authReject);
          this.connected = true;
          this.queue.forEach((fn) => {
            fn();
          });
          this.queue = [];
          resolve(this);
          return;
        }

        if (this.paths[parsed.path]) {
          const tid = parsed.tid;
          logger.debug('Received request', parsed.request);
          this.paths[parsed.path].emit('request', parsed.request);
          this.paths[parsed.path].emit('requestHandler', parsed.request, new Response(this, tid));
        }
      });
    });
  }

  sendRes(tid, response) {
    logger.debug('Sending response', response);
    this.ws.send(JSON.stringify({
      tid,
      response,
    }));
  }

  disconnect() {
    logger.debug('Client closed');
    this.ws.close();
  }

  createListener(path, requestHandler) {
    let handler = undefined;
    let realPath = undefined;
    if (typeof path === 'function' && typeof requestHandler === 'undefined') {
      handler = path;
    } else {
      handler = requestHandler;
      realPath = path;
    }

    const msg = { action: 'createCallbackUrl' };
    if (typeof realPath !== 'undefined') {
      msg.path = realPath;
    }
    return this.sendRecv(msg)
      .then((message) => {
        logger.debug(`Received callback url ${message.path}`);
        const responder = new Responder(this, message.path);
        this.paths[message.path] = responder;
        if (typeof handler === 'function') {
          responder.handler = handler;
        }
        responder.on('requestHandler', (req, res) => {
          responder.handler(req, res);
        });
        return responder;
      });
  }

  sendRecv(msg) {
    const tid = uuid.v4();
    const message = msg;
    message.tid = tid;

    return new Promise((resolve, reject) => {
      let timeout = null;

      const listener = (rawMessage) => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawMessage);
        } catch (e) {
          return;
        }

        if (parsed.tid !== tid) {
          return;
        }

        this.ws.removeListener('message', listener);
        clearTimeout(timeout);

        if (message.error) {
          logger.debug('Received error', parsed);
          reject(parsed);
          return;
        }

        logger.debug('Received message', parsed);
        resolve(parsed);
      };

      const run = () => {
        timeout = setTimeout(() => {
          this.ws.removeListener('message', listener);
          reject(new Error('timed out'));
        }, 2000);

        this.ws.on('message', listener);

        logger.debug('Sending message', message);
        this.ws.send(JSON.stringify(message));
      };

      if (this.connected === true) {
        run();
      } else {
        this.queue.push(() => run());
      }
    });
  }
}

module.exports = Client;
