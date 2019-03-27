const path = require('path');
const findUp = require('find-up');
const { PACKAGE_JSON, YOSHI_CONFIG } = require('./constants');

module.exports = function resolveConfig(cwd) {
  const configPath = findUp.sync([YOSHI_CONFIG, PACKAGE_JSON], { cwd });

  if (!configPath) {
    throw new Error(
      `Cannot find ${YOSHI_CONFIG} or ${PACKAGE_JSON} anywhere in ${cwd}`,
    );
  }

  return {
    configPath,
    rootDir: path.dirname(configPath),
  };
};
