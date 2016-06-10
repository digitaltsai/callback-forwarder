'use strict';

class Response {
  constructor(client, tid) {
    this.res = {
      status: 200,
    };
    this.client = client;
    this.tid = tid;
  }

  status(status) {
    this.res.status = status;
    return this;
  }

  header(field, value) {
    if (typeof field === 'object') {
      this.res.headers = field;
    } else {
      this.res.headers = {
        [field]: value,
      };
    }
    return this;
  }

  json(str) {
    try {
      return this.end(JSON.stringify(str));
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }

  end(str) {
    this.res.body = this.res.body || str;
    this.client.sendRes(this.tid, this.res);
    return this;
  }

  send(str) {
    return this.end(str);
  }

  sendStatus(status) {
    return this.status(status).end();
  }
}

module.exports = Response;
