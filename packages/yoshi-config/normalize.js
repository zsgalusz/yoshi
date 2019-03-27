const path = require('path');
const { PACKAGE_JSON } = require('./constants');
const DEFAULT_CONFIG = require('./defaults');
const { multipleModules, singleModule } = require('./globs');

function normalizeClientFilesPath(result) {
  const clientProjectName = result.clientProjectName;
  const { dir } = result.servers.cdn;

  if (clientProjectName) {
    return path.join(
      'node_modules',
      clientProjectName,
      dir || multipleModules.clientDist,
    );
  }

  return dir || singleModule.clientDist;
}

function normalizeCdnUrl(result) {
  const { port, ssl } = result.servers.cdn;
  const protocol = ssl ? 'https' : 'http';

  return `${protocol}://localhost:${port}/`;
}

function hasDependency(packageName, packageJson) {
  const { dependencies = {}, peerDependencies = {} } = packageJson;
  return dependencies[packageName] || peerDependencies[packageName];
}

module.exports = function normalize({ configObject, rootDir }) {
  const packageJson = require(path.resolve(rootDir, PACKAGE_JSON));

  const result = { ...DEFAULT_CONFIG, ...configObject };

  result.name = packageJson.name || '';

  result.isAngularProject = hasDependency('angular', packageJson);
  result.isReactProject = hasDependency('react', packageJson);

  result.jestConfig = packageJson.jest;
  result.petriSpecsConfig = configObject.petriSpecs;
  result.performanceBudget = configObject.performance;

  if (!result.servers.cdn.url) {
    result.servers.cdn.url = normalizeCdnUrl(result);
  }

  result.clientFilesPath = normalizeClientFilesPath(result);

  return result;
};
