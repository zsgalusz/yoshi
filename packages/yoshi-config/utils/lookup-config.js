const cosmiconfig = require('cosmiconfig');
const get = require('lodash/get');

const explorer = cosmiconfig('yoshi', {
  rc: false,
  sync: true,
});

module.exports = cwd => {
  const projectConfig = get(explorer.load(cwd), 'config', {});

  if (projectConfig.extends) {
    const extendsConfig = require(projectConfig.extends);

    return {
      ...extendsConfig.defaultConfig,
      ...projectConfig,
    };
  }

  return projectConfig;
};
