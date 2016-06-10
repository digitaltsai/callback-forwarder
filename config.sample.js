module.exports = {
  hostname: '127.0.0.1' || process.env.HOST,
  port: 80 || process.env.POST,
  secure: false || process.env.SSL,
  sharedSecret: 'YOURSECRET' || process.env.SHARED_SECRET,
};
