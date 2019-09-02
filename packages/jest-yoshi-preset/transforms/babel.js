const babelJest = require('babel-jest');
const { createBabelConfig } = require('yoshi-helpers/utils');
const { serverTransform } = require('../utils');

const babelConfig = createBabelConfig();
const transformer = babelJest.createTransformer(babelConfig);

module.exports = serverTransform(transformer);
