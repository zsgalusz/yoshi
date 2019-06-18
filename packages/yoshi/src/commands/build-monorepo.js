process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2));

const chalk = require('chalk');
const { apps, libs } = require('yoshi-config/monorepo');
const {
  printBundleSizeSuggestion,
  printBuildResult,
} = require('./utils/assets');
const buildApps = require('./utils/build-apps');
const buildLibs = require('./utils/build-libs');

module.exports = async () => {
  // Build all libs
  await buildLibs(libs);

  // Build all apps;
  const { webpackObj } = await buildApps(apps, cliArgs);

  // Print a nice output
  apps.forEach((app, index) => {
    console.log(chalk.bold.underline(app.name));
    console.log();

    const [, clientOptimizedStats, serverStats] = webpackObj.stats[index];

    printBuildResult({
      app,
      webpackStats: [clientOptimizedStats, serverStats],
    });

    console.log();
  });

  printBundleSizeSuggestion();

  return {
    persistent: false,
  };
};
