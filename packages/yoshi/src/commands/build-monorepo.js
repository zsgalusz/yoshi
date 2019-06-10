process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const execa = require('execa');
const globby = require('globby');
const webpack = require('webpack');
const filesize = require('filesize');
const { sync: gzipSize } = require('gzip-size');
const { apps, libs } = require('yoshi-helpers/monorepo');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const {
  createClientWebpackConfig,
  createServerWebpackConfig,
} = require('../../config/webpack.config');

const prepareAssets = ({ stats, app, assetsDir }) =>
  stats
    .toJson({ all: false, assets: true })
    .assets.filter(asset => !asset.name.endsWith('.map'))
    .map(asset => {
      const fileContents = fs.readFileSync(path.join(assetsDir, asset.name));

      return {
        folder: path.join(
          path.relative(app.ROOT_DIR, assetsDir),
          path.dirname(asset.name),
        ),
        name: path.basename(asset.name),
        gzipSize: gzipSize(fileContents),
        size: asset.size,
      };
    })
    .sort((a, b) => b.gzipSize - a.gzipSize);

const printBuildResult = (assets, assetNameColor) =>
  assets.forEach(asset => {
    console.log(
      '  ' +
        filesize(asset.size) +
        '  ' +
        `(${filesize(asset.gzipSize)} GZIP)` +
        '  ' +
        `${chalk.dim(asset.folder + path.sep)}${chalk[assetNameColor](
          asset.name,
        )}`,
    );
  });

module.exports = async () => {
  // Clean tmp folders
  apps.forEach(app => {
    fs.emptyDirSync(app.BUILD_DIR);
    fs.emptyDirSync(app.TARGET_DIR);
  });

  libs.forEach(lib => {
    fs.emptyDirSync(lib.BUILD_DIR);
  });

  // Copy public to statics dir
  apps.forEach(app => {
    if (fs.pathExistsSync(app.PUBLIC_DIR)) {
      fs.copySync(app.PUBLIC_DIR, app.ASSETS_DIR);
    }
  });

  libs.forEach(lib => {
    const assets = globby.sync('src/**/*', {
      cwd: lib.ROOT_DIR,
      ignore: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.json'],
    });

    assets.forEach(assetPath => {
      const dirname = path.join(lib.BUILD_DIR, assetPath);

      fs.ensureDirSync(path.dirname(dirname));
      fs.copyFileSync(path.join(lib.ROOT_DIR, assetPath), dirname);
    });
  });

  // Build libraries
  const scopeFlags = libs.map(lib => `--scope=${lib.name}`);

  try {
    await execa.shell(`npx lerna exec ${scopeFlags.join(' ')} -- npx tsc`, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.log(chalk.red('Failed to compile.\n'));
    console.error(error.stack);

    process.exit(1);
  }

  libs.forEach(lib => {
    const assets = globby.sync('src/**/*', {
      cwd: lib.ROOT_DIR,
      ignore: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.json'],
    });

    assets.forEach(assetPath => {
      fs.copyFileSync(
        path.join(lib.ROOT_DIR, assetPath),
        path.join(lib.BUILD_DIR, assetPath),
      );
    });
  });

  // Build apps
  const webpackConfigs = apps.reduce((acc, app) => {
    const clientDebugConfig = createClientWebpackConfig({
      app,
      isDebug: true,
      isAnalyze: false,
      isHmr: false,
    });

    const clientOptimizedConfig = createClientWebpackConfig({
      app,
      isDebug: false,
      isHmr: false,
    });

    const serverConfig = createServerWebpackConfig({
      app,
      isDebug: true,
    });

    return [...acc, clientDebugConfig, clientOptimizedConfig, serverConfig];
  }, []);

  const compiler = webpack(webpackConfigs);

  const webpackStats = await new Promise((resolve, reject) => {
    compiler.run((err, stats) => (err ? reject(err) : resolve(stats)));
  });

  const messages = formatWebpackMessages(webpackStats.toJson({}, true));

  if (messages.errors.length) {
    // Only keep the first error. Others are often indicative
    // of the same problem, but confuse the reader with noise.
    if (messages.errors.length > 1) {
      messages.errors.length = 1;
    }

    console.log(chalk.red('Failed to compile.\n'));
    console.error(messages.errors.join('\n\n'));

    process.exit(1);
  }

  if (messages.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));
  } else {
    console.log(chalk.green('Compiled successfully.\n'));
  }

  // Calculate assets sizes
  apps.forEach((app, index) => {
    const clientAssets = prepareAssets({
      app,
      stats: webpackStats.stats[index * 3 + 1],
      assetsDir: app.STATICS_DIR,
    });
    const serverAssets = prepareAssets({
      app,
      stats: webpackStats.stats[index * 3 + 2],
      assetsDir: app.BUILD_DIR,
    });

    console.log(chalk.bold.underline(app.name));
    printBuildResult(clientAssets, 'cyan');
    printBuildResult(serverAssets, 'yellow');
    console.log();
  });

  console.log(chalk.dim('    Interested in reducing your bundle size?'));
  console.log();
  console.log(
    chalk.dim('      > Try https://webpack.js.org/guides/code-splitting'),
  );
  console.log(
    chalk.dim(
      `      > If it's still large, analyze your bundle by running \`npx yoshi build --analyze\``,
    ),
  );

  return {
    persistent: false,
  };
};
