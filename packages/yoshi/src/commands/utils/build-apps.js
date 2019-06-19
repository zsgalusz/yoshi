const bfj = require('bfj');
const path = require('path');
const fs = require('fs-extra');
const { chunk } = require('lodash');
const { inTeamCity: checkInTeamCity } = require('yoshi-helpers/queries');
const { copyTemplates } = require('./copy-assets');
const writeManifest = require('./write-manifest');
const { runWebpack } = require('../../webpack-utils');
const {
  createClientWebpackConfig,
  createServerWebpackConfig,
} = require('../../../config/webpack.config');
const wixDepCheck = require('../../tasks/dep-check');

const inTeamCity = checkInTeamCity();

module.exports = async function buildApps(apps, options) {
  // Clean tmp folders
  await Promise.all(
    apps.reduce((acc, app) => {
      return [...acc, fs.emptyDir(app.BUILD_DIR), fs.emptyDir(app.TARGET_DIR)];
    }, []),
  );

  // Copy public to statics dir
  Promise.all(
    apps.map(async app => {
      if (await fs.pathExists(app.PUBLIC_DIR)) {
        await fs.copy(app.PUBLIC_DIR, app.ASSETS_DIR);
      }
    }),
  );

  Promise.all(
    apps.map(async app => {
      await Promise.all([
        wixDepCheck({ cwd: app.ROOT_DIR }),
        copyTemplates(app),
      ]);
    }),
  );

  // Run CI related updates
  if (inTeamCity) {
    const petriSpecs = require('../../tasks/petri-specs');
    const wixMavenStatics = require('../../tasks/maven-statics');

    await Promise.all(
      apps.reduce((acc, app) => {
        return [
          ...acc,
          petriSpecs({ config: app.petriSpecsConfig }),
          wixMavenStatics({
            clientProjectName: app.clientProjectName,
            staticsDir: app.clientFilesPath,
          }),
        ];
      }, []),
    );
  }

  // Build apps
  const webpackConfigs = apps.reduce((acc, app) => {
    const clientDebugConfig = createClientWebpackConfig({
      app,
      isDebug: true,
      isAnalyze: false,
      isHmr: false,
      withLocalSourceMaps: options['source-map'],
    });

    const clientOptimizedConfig = createClientWebpackConfig({
      app,
      isDebug: false,
      isAnalyze: options.analyze,
      isHmr: false,
      withLocalSourceMaps: options['source-map'],
    });

    const serverConfig = createServerWebpackConfig({
      app,
      isDebug: true,
    });

    return [...acc, clientDebugConfig, clientOptimizedConfig, serverConfig];
  }, []);

  const webpackStats = await runWebpack(webpackConfigs);

  // Chunk configs/stats for easier access per app
  const webpackObj = {
    stats: chunk(webpackStats.stats, 3),
    configs: chunk(webpackConfigs, 3),
  };

  // Generate `manifest.[version].json` from optimized webpack bundle
  if (inTeamCity) {
    await Promise.all(
      apps.map(async (app, index) => {
        const [, clientOptimizedConfig] = webpackObj.configs[index];
        const [, clientOptimizedStats] = webpackObj.stats[index];

        await writeManifest(clientOptimizedConfig, clientOptimizedStats, app);
      }),
    );
  }

  // Write a Webpack stats file
  if (options.stats) {
    await Promise.all(
      apps.map(async (app, index) => {
        const [, clientOptimizedStats] = webpackObj.stats[index];

        await fs.ensureDir(path.dirname(app.STATS_FILE));
        await bfj.write(app.STATS_FILE, clientOptimizedStats.toJson());
      }),
    );
  }

  return {
    webpackObj,
  };
};
