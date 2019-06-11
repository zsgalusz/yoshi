const execa = require('execa');
const { partition } = require('lodash');
const { getPaths } = require('yoshi-config/paths');
const loadConfig = require('yoshi-config/loadConfig');

const { stdout } = execa.shellSync('npx lerna list --all --json');

const packages = JSON.parse(stdout).map(pkg => {
  const paths = getPaths(pkg.location);
  const config = loadConfig({ cwd: pkg.location });

  return {
    ...pkg,
    ...paths,
    ...config,
  };
});

const [apps, libs] = partition(packages, pkg => pkg.private);

module.exports = {
  app: apps[0],
  apps,
  libs,
};
