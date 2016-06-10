'use strict';

const uuid = require('uuid');

const logger = require('../common/Logger')('CallbackClient');

class CallbackClient {
  constructor(callbackServer, ws) {
    this.callbackServer = callbackServer;
    this.ws = ws;
    this.id = uuid.v4();
    this.paths = {};

    this.ws.on('message', (message) => {
      this.parseMessage(message);
    });
  }

  parseMessage(message) {
    let parsed;
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
      case 'createCallbackUrl': {
        // tell the server to forward a new url
        this.createCallbackUrl(parsed.path)
          .then((fullPath) => {
            logger.debug(`Sending callback url ${fullPath}`);
            this.ws.send(JSON.stringify({
              tid: parsed.tid,
              path: fullPath,
            }));
          })
          .catch((err) => {
            this.ws.send(JSON.stringify({
              tid: parsed.tid,
              error: err.message,
            }));
          });
        break;
      }
      default: {
        this.ws.send(JSON.stringify({
          error: 'Invalid action specified',
        }));
        break;
      }
    }
  }

  createCallbackUrl(pathInput) {
    if (!pathInput || pathInput[0] !== '/') {
      Promise.reject('Invalid path');
    }

    const path = pathInput || `/${this.id}/${uuid.v4()}`;
    return this.callbackServer.createCallbackUrl(path, this)
      .then(() => {
        this.paths[path] = true;
        return path;
      });
  }

  deleteCallbackUrl(path) {
    delete this.paths[path];
    this.callbackServer.deleteCalbackUrl(path);
  }

  // this will just ask the client for a response
  askClientForResponse(path, request) {
    const tid = uuid.v4();
    return new Promise((resolve, reject) => {
      let timeout = null;

      const pathListener = (rawMessage) => {
        let message = null;
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
        this.ws.removeListener('message', pathListener);
        clearTimeout(timeout);
        resolve(message.response);
      };

      timeout = setTimeout(() => {
        reject(new Error('Did not receive response in time'));
        this.ws.removeListener('message', pathListener);
      }, 5000);

      this.ws.on('message', pathListener);

      this.ws.send(JSON.stringify({
        tid,
        path,
        request,
      }));
    });
  }
}

module.exports = CallbackClient;
