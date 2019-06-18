const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const globby = require('globby');
const webpack = require('webpack');
const filesize = require('filesize');
const { groupBy } = require('lodash');
const { sync: gzipSize } = require('gzip-size');
const { getProjectArtifactVersion } = require('yoshi-helpers/utils');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const rootApp = require('yoshi-helpers/root-app');
const chokidar = require('chokidar');
const {
  createClientWebpackConfig,
  createServerWebpackConfig,
} = require('../../../config/webpack.config');

function printBundleSizeSuggestion() {
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
}

function printBuildResult({ app = rootApp, webpackStats }) {
  const [clientStats, serverStats] = webpackStats;

  const clientAssets = prepareAssets(clientStats, app.STATICS_DIR, app);
  const serverAssets = prepareAssets(serverStats, app.BUILD_DIR, app);

  printStatsResult(clientAssets, 'cyan');
  printStatsResult(serverAssets, 'yellow');
}

function createAppWebpackConfigs({ app = rootApp, cliArgs }) {
  const clientDebugConfig = createClientWebpackConfig({
    app,
    isDebug: true,
    isAnalyze: false,
    isHmr: false,
    withLocalSourceMaps: cliArgs['source-map'],
  });

  const clientOptimizedConfig = createClientWebpackConfig({
    app,
    isDebug: false,
    isAnalyze: cliArgs.analyze,
    isHmr: false,
    withLocalSourceMaps: cliArgs['source-map'],
  });

  const serverConfig = createServerWebpackConfig({
    app,
    isDebug: true,
  });

  return [clientDebugConfig, clientOptimizedConfig, serverConfig];
}

async function copyTemplates(app = rootApp) {
  const files = await globby('**/*.{ejs,vm}', { cwd: app.SRC_DIR });

  await Promise.all(
    files.map(file => {
      return fs.copy(
        path.join(app.SRC_DIR, file),
        path.join(app.STATICS_DIR, file),
      );
    }),
  );
}

function watchPublicFolder(app = rootApp) {
  const watcher = chokidar.watch(app.PUBLIC_DIR, {
    persistent: true,
    ignoreInitial: false,
    cwd: app.PUBLIC_DIR,
  });

  const copyFile = relativePath => {
    return fs.copy(
      path.join(app.PUBLIC_DIR, relativePath),
      path.join(app.ASSETS_DIR, relativePath),
    );
  };

  const removeFile = relativePath => {
    return fs.remove(path.join(app.ASSETS_DIR, relativePath));
  };

  watcher.on('change', copyFile);
  watcher.on('add', copyFile);
  watcher.on('unlink', removeFile);
}

function prepareAssets(optimizedStats, assetsDir, app = rootApp) {
  return optimizedStats
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
}

function printStatsResult(assets, assetNameColor) {
  return assets.forEach(asset => {
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
}

async function writeManifest(config, stats, app = rootApp) {
  const assetsJson = stats.compilation.chunkGroups.reduce((acc, chunk) => {
    acc[chunk.name] = [
      // If a chunk shows more than once, append to existing files
      ...(acc[chunk.name] || []),
      // Add files to the list
      ...chunk.chunks.reduce(
        (files, child) => [
          ...files,
          ...child.files
            // Remove map files
            .filter(file => !file.endsWith('.map'))
            // Remove rtl.min.css files
            .filter(file => !file.endsWith('.rtl.min.css'))
            // Resolve into an absolute path, relatively to publicPath
            .map(file => url.resolve(config.output.publicPath, file)),
        ],
        [],
      ),
    ];
    return acc;
  }, {});

  // Group extensions together
  Object.keys(assetsJson).forEach(entryName => {
    assetsJson[entryName] = groupBy(assetsJson[entryName], fileUrl => {
      const { pathname } = url.parse(fileUrl);
      const extension = path.extname(pathname);

      return extension ? extension.slice(1) : '';
    });
  });

  // Artifact version on CI
  const artifactVersion = getProjectArtifactVersion();

  // Write file to disc
  await fs.writeJSON(
    path.resolve(app.STATICS_DIR, `manifest.${artifactVersion}.json`),
    assetsJson,
    { spaces: 2 },
  );
}

function copyLibraryAssets(lib) {
  const assets = globby.sync('src/**/*', {
    cwd: lib.ROOT_DIR,
    ignore: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.json'],
  });

  assets.forEach(assetPath => {
    const dirname = path.join(lib.BUILD_DIR, assetPath);

    fs.ensureDirSync(path.dirname(dirname));
    fs.copyFileSync(path.join(lib.ROOT_DIR, assetPath), dirname);
  });
}

async function runWebpack(configs) {
  try {
    const compiler = webpack(configs);

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

      throw new Error(messages.errors.join('\n\n'));
    }

    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.\n'));
      console.log(messages.warnings.join('\n\n'));
    } else {
      console.log(chalk.green('Compiled successfully.\n'));
    }

    return webpackStats;
  } catch (error) {
    console.log(chalk.red('Failed to compile.\n'));
    console.error(error.message || error);

    process.exit(1);
  }
}

module.exports = {
  runWebpack,
  printBuildResult,
  writeManifest,
  watchPublicFolder,
  copyTemplates,
  copyLibraryAssets,
  createAppWebpackConfigs,
  printBundleSizeSuggestion,
};
