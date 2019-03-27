const path = require('path');
const config = require('yoshi-config');

module.exports = function unprocessedModules(p) {
  const allSourcesButExternalModules = function(filePath) {
    filePath = path.normalize(filePath);
    return (
      filePath.startsWith(process.cwd()) && !filePath.includes('node_modules')
    );
  };

  const externalUnprocessedModules = ['wix-style-react/src'].concat(
    config.externalUnprocessedModules,
  );

  const externalRegexList = externalUnprocessedModules.map(
    m => new RegExp(`node_modules/${m}`),
  );

  return (
    externalRegexList.some(regex => regex.test(p)) ||
    allSourcesButExternalModules(p)
  );
};
