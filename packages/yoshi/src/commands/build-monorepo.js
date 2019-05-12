process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2));

const url = require('url');
const bfj = require('bfj');
const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const chalk = require('chalk');
const globby = require('globby');
const webpack = require('webpack');
const filesize = require('filesize');
const { groupBy, chunk } = require('lodash');
const { sync: gzipSize } = require('gzip-size');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const {
  createClientWebpackConfig,
  createServerWebpackConfig,
} = require('../../config/webpack.config');
const { inTeamCity: checkInTeamCity } = require('yoshi-helpers/queries');
const { getProjectArtifactVersion } = require('yoshi-helpers/utils');
const { getPaths } = require('yoshi-config/paths');
const {
  petriSpecsConfig,
  clientProjectName,
  clientFilesPath,
} = require('yoshi-config');
const wixDepCheck = require('../tasks/dep-check');

const inTeamCity = checkInTeamCity();

const copyTemplates = async ({ paths }) => {
  const files = await globby('**/*.{ejs,vm}', { cwd: paths.SRC_DIR });

  await Promise.all(
    files.map(file => {
      return fs.copy(
        path.join(paths.SRC_DIR, file),
        path.join(paths.STATICS_DIR, file),
      );
    }),
  );
};

const prepareAssets = (optimizedStats, assetsDir, rootDir) => {
  return optimizedStats
    .toJson({ all: false, assets: true })
    .assets.filter(asset => !asset.name.endsWith('.map'))
    .map(asset => {
      const fileContents = fs.readFileSync(path.join(assetsDir, asset.name));

      return {
        folder: path.join(
          path.relative(rootDir, assetsDir),
          path.dirname(asset.name),
        ),
        name: path.basename(asset.name),
        gzipSize: gzipSize(fileContents),
        size: asset.size,
      };
    })
    .sort((a, b) => b.gzipSize - a.gzipSize);
};

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

const { splitPackagesPromise } = require('./utils');

module.exports = async () => {
  const [apps, libs] = await splitPackagesPromise;

  apps.forEach(app => {
    app.paths = getPaths(app.location);
  });

  libs.forEach(lib => {
    lib.paths = getPaths(lib.location);
  });

  // Clean tmp folders
  await Promise.all([
    ...apps.map(({ paths }) => {
      return Promise.all([
        fs.emptyDir(paths.BUILD_DIR),
        fs.emptyDir(paths.TARGET_DIR),
      ]);
    }),

    ...libs.map(({ paths }) => {
      return Promise.all([fs.emptyDir(paths.BUILD_DIR)]);
    }),
  ]);

  // Copy public to statics dir
  Promise.all([
    ...apps.map(async ({ paths }) => {
      if (await fs.pathExists(paths.PUBLIC_DIR)) {
        await fs.copy(paths.PUBLIC_DIR, paths.ASSETS_DIR);
      }
    }),

    ...libs.map(async ({ paths, location }) => {
      const assets = await globby('src/**/*', {
        cwd: paths.ROOT_DIR,
        ignore: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.json'],
      });

      await Promise.all(
        assets.map(async assetPath => {
          const targetFilePath = path.join(location, 'dist', assetPath);

          await fs.ensureFile(targetFilePath);
          await fs.copyFile(path.join(location, assetPath), targetFilePath);
        }),
      );
    }),
  ]);

  await Promise.all(
    apps.map(app => {
      return Promise.all([
        wixDepCheck({ cwd: app.location }),
        copyTemplates(app),
      ]);
    }),
  );

  // Run CI related updates
  if (inTeamCity) {
    const petriSpecs = require('../tasks/petri-specs');
    const wixMavenStatics = require('../tasks/maven-statics');

    await Promise.all([
      petriSpecs({ config: petriSpecsConfig }),
      wixMavenStatics({
        clientProjectName,
        staticsDir: clientFilesPath,
      }),
    ]);
  }

  await execa.shell(`npx tsc -b ${libs.map(lib => lib.location).join(' ')}`, {
    stdio: 'inherit',
  });

  const appsConfigs = apps.reduce((acc, { paths }) => {
    const clientDebugConfig = createClientWebpackConfig({
      isDebug: true,
      isAnalyze: false,
      isHmr: false,
      withLocalSourceMaps: cliArgs['source-map'],
      paths,
    });

    const clientOptimizedConfig = createClientWebpackConfig({
      isDebug: false,
      isAnalyze: cliArgs.analyze,
      isHmr: false,
      withLocalSourceMaps: cliArgs['source-map'],
      paths,
    });

    const serverConfig = createServerWebpackConfig({
      isDebug: true,
      paths,
    });

    return [...acc, clientDebugConfig, clientOptimizedConfig, serverConfig];
  }, []);

  let webpackStats;
  let messages;

  try {
    const compiler = webpack(appsConfigs);

    webpackStats = await new Promise((resolve, reject) => {
      compiler.run((err, stats) => (err ? reject(err) : resolve(stats)));
    });

    messages = formatWebpackMessages(webpackStats.toJson({}, true));

    if (messages.errors.length) {
      // Only keep the first error. Others are often indicative
      // of the same problem, but confuse the reader with noise.
      if (messages.errors.length > 1) {
        messages.errors.length = 1;
      }

      throw new Error(messages.errors.join('\n\n'));
    }
  } catch (error) {
    console.log(chalk.red('Failed to compile.\n'));
    console.error(error.message || error);

    process.exit(1);
  }

  if (messages.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));
  } else {
    console.log(chalk.green('Compiled successfully.\n'));
  }

  const appsWebpackStats = chunk(webpackStats.stats, 3);

  await Promise.all(
    appsWebpackStats.map(async stats => {
      const clientOptimizedStats = stats[1];

      // Generate `manifest.[version].json` from optimized webpack bundle
      if (inTeamCity) {
        const assetsJson = clientOptimizedStats.compilation.chunkGroups.reduce(
          (acc, chunk) => {
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
                    .map(file =>
                      url.resolve(
                        clientOptimizedConfig.output.publicPath,
                        file,
                      ),
                    ),
                ],
                [],
              ),
            ];
            return acc;
          },
          {},
        );

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
          path.resolve(STATICS_DIR, `manifest.${artifactVersion}.json`),
          assetsJson,
          { spaces: 2 },
        );
      }
    }),
  );

  // Calculate assets sizes
  apps.map((app, index) => {
    const clientAssets = prepareAssets(
      webpackStats.stats[index * 3 + 1],
      app.paths.STATICS_DIR,
      app.paths.ROOT_DIR,
    );
    const serverAssets = prepareAssets(
      webpackStats.stats[index * 3 + 2],
      app.paths.BUILD_DIR,
      app.paths.ROOT_DIR,
    );

    // Print build result nicely
    console.log(chalk.bold.cyan(app.name));
    console.log();

    printBuildResult(clientAssets, 'cyan');
    printBuildResult(serverAssets, 'yellow');
  });

  console.log();
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

  if (cliArgs.stats) {
    await fs.ensureDir(path.dirname(STATS_FILE));
    await bfj.write(STATS_FILE, webpackStats.toJson());
  }

  return {
    persistent: !!cliArgs.analyze,
  };
};
