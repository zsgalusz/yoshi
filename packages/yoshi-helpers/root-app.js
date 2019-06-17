const paths = require('yoshi-config/paths');
const config = require('yoshi-config');

const app = {
  ...paths,
  ...config,
};

module.exports = app;
