const paths = require('./paths');
const config = require('./index');

const app = {
  ...paths,
  ...config,
};

module.exports = app;
