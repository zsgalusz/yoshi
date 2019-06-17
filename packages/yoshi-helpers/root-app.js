const { getPaths } = require('yoshi-config/paths');
const loadConfig = require('yoshi-config/loadConfig');

const paths = getPaths();
const config = loadConfig();

const app = {
  ...paths,
  ...config,
};

module.exports = app;
