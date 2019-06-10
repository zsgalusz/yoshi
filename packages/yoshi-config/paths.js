const path = require('path');
const findUp = require('find-up');

function getPaths(ROOT_DIR) {
  const resolvePath = (...args) => path.resolve(ROOT_DIR, ...args);

  const SRC_DIR = resolvePath('src');
  const BUILD_DIR = resolvePath('dist');
  const TARGET_DIR = resolvePath('target');
  const PUBLIC_DIR = path.join(SRC_DIR, 'assets');
  const STATICS_DIR = path.join(BUILD_DIR, 'statics');
  const ASSETS_DIR = path.join(STATICS_DIR, 'assets');

  const LERNA_JSON = findUp.sync('lerna.json');
  const MONOREPO_ROOT = LERNA_JSON && path.dirname(LERNA_JSON);

  const NODE_PLATFORM_DEFAULT_CONFIGS_DIR = resolvePath('test/configs');

  const POM_FILE = resolvePath('pom.xml');
  const STATS_FILE = resolvePath(TARGET_DIR, 'webpack-stats.json');
  const TSCONFIG_FILE = resolvePath('tsconfig.json');
  const SERVER_LOG_FILE = resolvePath(TARGET_DIR, 'server.log');

  return {
    ROOT_DIR,
    SRC_DIR,
    BUILD_DIR,
    TARGET_DIR,
    PUBLIC_DIR,
    STATICS_DIR,
    ASSETS_DIR,
    POM_FILE,
    STATS_FILE,
    TSCONFIG_FILE,
    SERVER_LOG_FILE,

    LERNA_JSON,
    MONOREPO_ROOT,

    NODE_PLATFORM_DEFAULT_CONFIGS_DIR,
  };
}

const rootAppPaths = getPaths(process.cwd());

module.exports = {
  // Generate paths for paths other than cwd
  getPaths,
  // Expose paths for root app
  ...rootAppPaths,
};
