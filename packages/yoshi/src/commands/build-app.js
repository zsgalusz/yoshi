process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2));

const rootApp = require('yoshi-config/root-app');
const buildApps = require('./utils/build-apps');
const {
  printBundleSizeSuggestion,
  printBuildResult,
} = require('./utils/assets');

module.exports = async () => {
  const { webpackObj } = await buildApps({ apps: [rootApp] });

  const [, clientOptimizedStats, serverStats] = webpackObj.stats;

  printBuildResult({ webpackStats: [clientOptimizedStats, serverStats] });
  printBundleSizeSuggestion();

  return {
    persistent: !!cliArgs.analyze,
  };
};
