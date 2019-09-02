const babelJest = require('babel-jest');
const { createBabelConfig } = require('yoshi-helpers/utils');
const transform = require('yoshi-server/build/jest-transform');

const babelConfig = createBabelConfig();
const transformer = babelJest.createTransformer(babelConfig);

module.exports = {
  process(source, filename, config, transformOptions) {
    let result = source;

    if (filename.endsWith('.api.js')) {
      result = transform.process(source, filename);
    }

    return transformer.process(result, filename, config, transformOptions);
  },
};
