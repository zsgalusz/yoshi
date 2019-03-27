const Ajv = require('ajv');
const ajvKeywords = require('ajv-keywords');
const YoshiOptionsValidationError = require('./utils/YoshiOptionsValidationError');

module.exports = (config, schema) => {
  const ajv = new Ajv({ jsonPointers: true, verbose: true, allErrors: true });
  ajvKeywords(ajv, ['instanceof']);
  const valid = ajv.validate(schema, config);

  if (!valid) {
    throw new YoshiOptionsValidationError(ajv.errors);
  }

  return valid;
};
