const normalize = require('./normalize');
const readConfig = require('./readConfig');
const resolveConfig = require('./resolveConfig');

function loadConfig({ validate = false }) {
  const { configPath, rootDir } = resolveConfig(process.cwd());
  const configObject = readConfig({ configPath, validate });

  const projectConfig = normalize({ configObject, rootDir });

  return projectConfig;
}

module.exports = loadConfig;
