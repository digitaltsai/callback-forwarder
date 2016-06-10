'use strict';

const request = require('request-promise');
const uuid = require('uuid');
const url = require('url');

const config = require('../config');
const Client = require('../client/index');
const Server = require('../server/CallbackServer');

describe('Tests', function () {
  if (process.env.SERVER) {
    before(function () {
      return new Server(config).start();
    });
  }

  describe('Connect', function () {
    it('Should connect', function () {
      const client = new Client(config);
      return client.connect().then(() => client.disconnect());
    });

    it('Should reject unwanted ws connections', function () {
      const copy = {};
      Object.assign(copy, config);
      copy.sharedSecret = 'WRONG SECRET';
      const client = new Client(copy);
      return client.connect()
        .then(() => {
          throw new Error('Should not have reached here');
        }, () => {
          Promise.resolve();
        });
    });

    it('Should close a ws that does not send a secret', function () {
      const copy = {};
      Object.assign(copy, config);
      delete copy.sharedSecret;
      const client = new Client(copy);
      return client.connect()
        .then(() => {
          throw new Error('Should not have reached here');
        }, () => {
          Promise.resolve();
        });
    });
  });

  describe.only('Callbacks', function () {
    let client = null;

    before(function () {
      client = new Client(config);
      return client.connect();
    });

    it('Should be able to create a listener with a callback and get a response', function () {
      return client.createListener((req, res) => {
        res.status(200);
        res.header('Content-Type', 'application/json');
        res.json({ message: 'done' });
      })
        .then((listener) => request({
          uri: listener.uri,
          resolveWithFullResponse: true,
        }))
        .then((res) => {
          expect(res.headers['content-type']).to.equal('application/json');
        });
    });

    it('Should be able to create a listener WITHOUT a callback and get a response', function () {
      return client.createListener()
        .then((listener) => request({
          uri: listener.uri,
          resolveWithFullResponse: true,
        }))
        .then((res) => {
          expect(res.statusCode).to.equal(200);
        });
    });

    it('Should be able to create a listener WITHOUT a callback initially and get a response', function () { // eslint-disable-line max-len
      return client.createListener()
        .then((listener) => {
          listener.setHandler((req, res) => {
            res.sendStatus(204);
          });
          return request({
            uri: listener.uri,
            resolveWithFullResponse: true,
          });
        })
        .then((res) => {
          expect(res.statusCode).to.equal(204);
        });
    });

    it('Should be able to specify a path', function () {
      const randomId = `/${uuid.v4()}`;
      return client.createListener(randomId)
        .then((listener) => {
          expect(url.parse(listener.uri).path).to.equal(randomId);
          return request({
            uri: listener.uri,
            resolveWithFullResponse: true,
          });
        })
        .then((res) => {
          expect(res.statusCode).to.equal(200);
        });
    });
  });
});
