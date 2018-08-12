const fs = require('fs');
const { stylableModuleFactory } = require('@stylable/node');

exports.process = stylableModuleFactory(
  {
    fileSystem: fs,
    requireModule: require,
  },
  require.resolve('@stylable/runtime'),
);
