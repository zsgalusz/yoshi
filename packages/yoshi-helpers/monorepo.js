const execa = require('execa');
const { partition } = require('lodash');
const { getPaths } = require('yoshi-config/paths');
const loadConfig = require('yoshi-config/loadConfig');

const { stdout } = execa.shellSync('npx lerna list --all --json');

const pkgs = JSON.parse(stdout).map(pkg => {
  const paths = getPaths(pkg.location);
  const config = loadConfig({ cwd: pkg.location });

  return {
    ...pkg,
    ...paths,
    ...config,
  };
});

const [apps, libs] = partition(pkgs, pkg => pkg.private);

module.exports = {
  apps,
  libs,
  pkgs,
};
