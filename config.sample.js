/* eslint-disable */

var Config = {};

Config.sharedSecret = 'YOURSECRET' || process.env.SHARED_SECRET;

// either do this part
Config.hostname = '127.0.0.1' || process.env.HOST;
Config.port = 80 || process.env.POST;
Config.secure = false || process.env.SSL;

// or do this part
Config.baseUrl = 'http://127.0.0.1:80';
