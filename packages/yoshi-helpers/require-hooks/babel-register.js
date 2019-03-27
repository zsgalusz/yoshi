const unprocessedModules = require('../unprocessed-modules');
const { createBabelConfig } = require('../utils');

const babelConfig = createBabelConfig();

require('@babel/register')({
  only: [unprocessedModules],
  ...babelConfig,
});
