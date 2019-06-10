const execa = require('execa');
const { partition } = require('lodash');
const { getPaths } = require('yoshi-config/paths');

const { stdout } = execa.shellSync('npx lerna list --all --json');

const packages = JSON.parse(stdout).map(pkg => {
  return {
    ...pkg,
    ...getPaths(pkg.location),
  };
});

const [apps, libs] = partition(packages, pkg => pkg.private);

module.exports = {
  app: apps[0],
  apps,
  libs,
};
