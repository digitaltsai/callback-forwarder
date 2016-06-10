# What is this

This is a way to create a callback url forwarder for services that uses callback urls. It's similar to ngrok and localtunnel.

You have a server that can connect to your clients through WebSockets. Whenever a request hits the webserver from somewhere else, it checks the clients to see if any are listening for that url.

This was created mostly to test callback urls.

# How to run

* Your own server and domain to run the server part of the code on
* It's preferred that you're on node 6 and npm 3

### Running the server

1. git clone
2. npm install
3. modify config.sample.js
4. npm run config
5. npm start

---

## Sample code for client

Goto the [Client README](client/README.md) to get more details about the api

```javascript
// create the client first
const client = new Client({
  hostname: 'yourdomain.com',
  port: 80, // or you can do baseUrl: 'http://yourdomain.com:80'
  sharedSecret: 'YOURSECRET'
});

// connect to the server
client.connect();

// create a listener on http://yourdomain.com/test
client.createListener('test', (req, res) => {
  res.status(200); // default is already 200
  res.header('Content-Type', 'text/plain');
  res.end('OK');
})
.then((listener) => {
  // now whenever you hit http://yourdomain.com/test, you
  // will get a status 200 and body of 'OK'
  request.get({
    uri: listener.url,
  }, function(err, res) {
    // response will be 'OK'
  });
});

```

---

# Testing

To run tests with internal server, you can do this:
```
SERVER=true npm test
```

Run tests with external server from config
```
run server
```

Run tests with debug logs
```
LOGLEVEL=debug npm test
```
