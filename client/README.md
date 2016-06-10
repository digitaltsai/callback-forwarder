---

# Client API

---

## Client methods and properties

### `new Client(options)`
`options Object`

* `host String`  
`port String`  
`baseUrl String` (overwrites host and port)  
`secure Boolean` (https and wss if true)  

### `Client.createListener([path, handler(req, res)])`
`path String` optional, if not give, you will be give a path  
`handler Function` optional, if not give, will return 200  
returns a `Listener`

---

## Listener methods and properties

### `Listener`

#### `Listener.uri`
(read-only) full url that the listener is listening to

#### `Listener.setHandler(handler(req, res))`
Overwrites the previous handler

#### `Listener.on('request', handler(req))`
Attaches an additional listener to the request

---
## Handler Request properties
### `Request` passed into the handler as the 1st parameter

#### `Request.method`

#### `Request.headers`

#### `Request.body`

---

## Handler Response methods

### `Response` passed into the handler as the 2nd parameter

#### `Response.end(str)`
Sends the response with the message `str`

#### `Response.header(field [, value])`
Sets the header for the response. Field can be an object if setting multiple headers
```javascript
res.set('Content-Type', 'text/plain');

res.set({
  'Content-Type': 'application/json',
  'Content-Length': '10',
});
```

#### `Response.json(obj)`
Same as `Response.end` but calls `JSON.stringify` on the obj first

#### `Response.status(statusCode)`
Sets the status for the respose

#### `Response.sendStatus(statusCode)`
Same as calling res.status(statusCode).end()

---
