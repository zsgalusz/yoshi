import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import importFresh from 'import-fresh';
import { validate } from 'jest-validate';
import validConfig from './validConfig';
import { Config } from './config';
import yoshiConfig from '..';

const importJestConfig = (configPath: string): Config => {
  try {
    return importFresh(configPath) as Config;
  } catch (error) {
    error.message = `Config ${chalk.bold(configPath)} is invalid:\n  ${
      error.message
    }`;
    throw error;
  }
};

export default (): Config => {
  const configPath = path.join(process.cwd(), 'jest-yoshi.config.js');

  // Use `yoshi.jest` field.
  let config = yoshiConfig.test;

  if (!config && fs.existsSync(configPath)) {
    // Use jest-yoshi.config.js. WILL BE DEPRECATED IN NEXT MAJOR UPDATE.
    config = importJestConfig(configPath);
  }

  if (!config) {
    // use default config if nothing found.
    return {};
  }

  validate(config, {
    exampleConfig: validConfig,
    recursiveBlacklist: [
      'puppeteer',
      'specOptions.globals',
      'e2eOptions.globals',
      'coverageThreshold',
    ],
  });

  return config;
};
