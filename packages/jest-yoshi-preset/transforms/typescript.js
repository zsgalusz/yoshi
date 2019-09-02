const { createTransformer } = require('ts-jest');
const { serverTransform } = require('../utils');

const transformer = createTransformer();

module.exports = serverTransform(transformer);
