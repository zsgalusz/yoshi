const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { templateConfigName } = require('./constants');

/**
 * Load template config from and returns template definition
 * @param {String} templatePath
 */
const loadTemplates = templatePath => {
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      chalk.red(
        `the following template directory does not exist: "${templatePath}"`,
      ),
    );
  }

  const templateConfigPath = path.join(templatePath, templateConfigName);

  if (!fs.existsSync(templateConfigPath)) {
    throw new Error(
      chalk.red(`all templates must contain a config file (${templateConfigName}) on the root of the template directory
but none was found on ${templatePath}`),
    );
  }

  const templateConfig = require(templateConfigPath);

  return { ...templateConfig, path: templatePath };
};

module.exports = loadTemplates;
