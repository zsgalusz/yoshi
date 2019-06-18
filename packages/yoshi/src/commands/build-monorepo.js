process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2));

const fs = require('fs-extra');
const chalk = require('chalk');
const execa = require('execa');
const { apps, libs, pkgs } = require('yoshi-config/monorepo');
const {
  runWebpack,
  printBundleSizeSuggestion,
  printBuildResult,
  copyLibraryAssets,
  createAppWebpackConfigs,
} = require('./utils/assets');

module.exports = async () => {
  // Clean tmp folders
  pkgs.forEach(pkg => {
    fs.emptyDirSync(pkg.BUILD_DIR);
    fs.emptyDirSync(pkg.TARGET_DIR);
  });

  // Copy public to statics dir
  apps.forEach(app => {
    if (fs.pathExistsSync(app.PUBLIC_DIR)) {
      fs.copySync(app.PUBLIC_DIR, app.ASSETS_DIR);
    }
  });

  libs.forEach(copyLibraryAssets);

  // Build libraries
  const scopeFlags = libs.map(lib => `--scope=${lib.name}`);

  try {
    await execa.shell(`npx lerna exec ${scopeFlags.join(' ')} -- npx tsc`);
  } catch (error) {
    console.log(chalk.red('Failed to compile.\n'));
    console.error(error.stack);

    process.exit(1);
  }

  // Build apps
  const webpackConfigs = apps.reduce((acc, app) => {
    const [
      clientDebugConfig,
      clientOptimizedConfig,
      serverConfig,
    ] = createAppWebpackConfigs({ app, cliArgs });

    return [...acc, clientDebugConfig, clientOptimizedConfig, serverConfig];
  }, []);

  const webpackStats = await runWebpack(webpackConfigs);

  // Calculate assets sizes
  apps.forEach((app, index) => {
    console.log(chalk.bold.underline(app.name));
    console.log();

    const stats = [
      webpackStats.stats[index * 3 + 1],
      webpackStats.stats[index * 3 + 2],
    ];

    printBuildResult({ app, webpackStats: stats });

    console.log();
  });

  printBundleSizeSuggestion();

  return {
    persistent: false,
  };
};
