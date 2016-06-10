'use strict';
require('source-map-support').install();

const http = require('http');
const url = require('url');

const CallbackClient = require('./CallbackClient');
const WebSocketHandler = require('./WebSocketHandler');

const logger = require('../common/Logger')('CallbackServer');

class CallbackServer {
  constructor(config) {
    this.config = config;
    this.paths = {};
    this.secret = config.sharedSecret;

    const server = http.createServer();
    this.server = server;

    const wsh = new WebSocketHandler(this); // eslint-disable-line

    server.on('request', (req, res) => {
      const parsedUrl = url.parse(req.url);

      if (parsedUrl.path === '/server/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          pathCount: this.paths.length,
        }));
        return;
      }

      if (!this.paths[parsedUrl.path]) {
        logger.debug('No matching path');
        res.writeHead(404);
        res.end();
        return;
      }

      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        const client = this.paths[parsedUrl.path];

        if (!client) {
          logger.debug('Lost connection to client before request completed');
          return;
        }

        const request = {
          method: req.method,
          headers: req.headers,
          uri: req.url,
          body,
        };

        const path = url.parse(req.url).path;

        logger.debug('Relaying request', request);
        client.askClientForResponse(path, request)
          .then((clientRes) => {
            logger.debug('Relaying response', clientRes);
            res.writeHead(clientRes.status, clientRes.headers);
            res.end(clientRes.body);
          })
          .catch((err) => {
            logger.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(err.message);
          });
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.hostname, (err) => {
        if (err) {
          logger.error(err);
          reject(err);
          return;
        }
        logger.debug(`Server started on ${this.config.hostname}:${this.config.port}`); // eslint-disable-line
        resolve();
      });
    });
  }

  stop() {
    this.server.close();
  }

  createClient(ws) {
    const callbackClient = new CallbackClient(this, ws);
    logger.debug(`Client created ${callbackClient.id}`);
    return callbackClient;
  }

  createCallbackUrl(path, client) {
    return new Promise((resolve, reject) => {
      if (this.paths[path]) {
        const err = new Error('already has a path');
        logger.error(err);
        reject(err);
        return;
      }
      logger.debug(`Created callback url ${path}`);
      this.paths[path] = client;
      resolve();
    });
  }

  deleteCallbackUrl(path) {
    delete this.paths[path];
  }

  deleteClient(callbackClient) {
    logger.debug(`Deleting client ${callbackClient.id}`);
    for (const path of Object.keys(callbackClient.paths)) {
      delete this.paths[path];
    }
  }
}

module.exports = CallbackServer;
