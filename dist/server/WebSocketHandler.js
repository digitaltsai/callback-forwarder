'use strict';

var WebSocketServer = require('ws').Server;

var logger = require('../common/Logger')('WebSocketHandler');

module.exports = function WebSocketHandler(callbackServer) {
  var wss = new WebSocketServer({ server: callbackServer.server });

  wss.on('connection', function (ws) {
    var authTimeout = null;

    function authListener(message) {
      clearTimeout(authTimeout);

      if (message !== callbackServer.secret) {
        logger.debug('Wrong shared secret');
        ws.close();
        return;
      }

      // client that interfaces with the server
      var client = callbackServer.createClient(ws);

      ws.send(JSON.stringify({ connected: true }));

      ws.on('close', function () {
        callbackServer.deleteClient(client);
      });
    }

    ws.once('message', authListener);

    authTimeout = setTimeout(function () {
      logger.debug('Shared secret timed out');
      ws.close();
    }, 1000);
  });
};
//# sourceMappingURL=WebSocketHandler.js.map