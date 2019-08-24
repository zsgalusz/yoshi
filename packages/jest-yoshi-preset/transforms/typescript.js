const { createTransformer } = require('ts-jest');
const transform = require('yoshi-server/build/jest-transform');

const transformer = createTransformer();

module.exports = {
  process(source, filename) {
    let result = source;

    if (filename.endsWith('.api.ts') || filename.endsWith('.api.tsx')) {
      result = transform.process(source, filename);
    }

    return transformer.process(result, filename);
  },
};
