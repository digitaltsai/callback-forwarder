'use strict';

const WebSocketServer = require('ws').Server;

const logger = require('../common/Logger')('WebSocketHandler');

module.exports = function WebSocketHandler(callbackServer) {
  const wss = new WebSocketServer({ server: callbackServer.server });

  wss.on('connection', (ws) => {
    let authTimeout = null;

    function authListener(message) {
      clearTimeout(authTimeout);

      if (message !== callbackServer.secret) {
        logger.debug('Wrong shared secret');
        ws.close();
        return;
      }

      // client that interfaces with the server
      const client = callbackServer.createClient(ws);

      ws.send(JSON.stringify({ connected: true }));

      ws.on('close', () => {
        callbackServer.deleteClient(client);
      });
    }

    ws.once('message', authListener);

    authTimeout = setTimeout(() => {
      logger.debug('Shared secret timed out');
      ws.close();
    }, 1000);
  });
};
