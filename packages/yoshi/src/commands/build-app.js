process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2));

const bfj = require('bfj');
const path = require('path');
const fs = require('fs-extra');
const { inTeamCity: checkInTeamCity } = require('yoshi-helpers/queries');
const {
  BUILD_DIR,
  TARGET_DIR,
  PUBLIC_DIR,
  ASSETS_DIR,
  STATS_FILE,
} = require('yoshi-config/paths');
const {
  petriSpecsConfig,
  clientProjectName,
  clientFilesPath,
} = require('yoshi-config');
const {
  printBundleSizeSuggestion,
  printBuildResult,
  writeManifest,
  copyTemplates,
  createAppWebpackConfigs,
  runWebpack,
} = require('./utils/assets');
const wixDepCheck = require('../tasks/dep-check');

const inTeamCity = checkInTeamCity();

module.exports = async () => {
  // Clean tmp folders
  await Promise.all([fs.emptyDir(BUILD_DIR), fs.emptyDir(TARGET_DIR)]);

  // Copy public to statics dir
  if (await fs.pathExists(PUBLIC_DIR)) {
    await fs.copy(PUBLIC_DIR, ASSETS_DIR);
  }

  await Promise.all([wixDepCheck(), copyTemplates()]);

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

  const [
    clientDebugConfig,
    clientOptimizedConfig,
    serverConfig,
  ] = createAppWebpackConfigs({ cliArgs });

  const webpackStats = await runWebpack([
    clientDebugConfig,
    clientOptimizedConfig,
    serverConfig,
  ]);

  const [, clientOptimizedStats, serverStats] = webpackStats.stats;

  // Generate `manifest.[version].json` from optimized webpack bundle
  if (inTeamCity) {
    await writeManifest(clientOptimizedConfig, clientOptimizedStats);
  }

  printBuildResult({ webpackStats: [clientOptimizedStats, serverStats] });
  printBundleSizeSuggestion();

  if (cliArgs.stats) {
    await fs.ensureDir(path.dirname(STATS_FILE));
    await bfj.write(STATS_FILE, webpackStats.toJson());
  }

  return {
    persistent: !!cliArgs.analyze,
  };
};
