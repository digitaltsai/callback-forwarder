This is just to create a callback forwarder for services that calls callback urls

# How to run

* Your own server and domain to run the server portion of the code on
* It's preferred that you're on node 6 and npm 3

### Running the server

1. git clone
2. npm install
3. modify config.sample.js
4. cp config.sample.js dist/config.js
5. npm start

---

## Sample code for client

Goto the [Client README](client/README.md) to get more details about the api

```javascript
// create the client first
const client = new Client({
  host: 'yourdomain.com',
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
