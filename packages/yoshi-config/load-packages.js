const execa = require('execa');
const { partition } = require('lodash');
const { getPaths } = require('./paths');
const loadConfig = require('./loadConfig');

module.exports = async () => {
  const { stdout } = await execa.shell('npx lerna list --all --json');

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

  return {
    apps,
    libs,
  };
};
