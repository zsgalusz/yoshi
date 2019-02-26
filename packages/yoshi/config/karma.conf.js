const path = require('path');
const _ = require('lodash');
const { tryRequire } = require('yoshi-helpers');
const isCI = require('is-ci');

const projectConfig = tryRequire(path.resolve('karma.conf.js')) || {
  files: [],
};

const baseConfig = {
  basePath: process.cwd(),
  browsers: ['ChromeCustom'],
  frameworks: projectConfig.frameworks ? [] : ['mocha'],
  files: ['dist/specs.bundle.js'],
  exclude: [],
  plugins: [require('karma-mocha'), require('karma-chrome-launcher')],
  colors: true,
  customLaunchers: {
    Chrome: {
      flags: ['--no-sandbox'],
    },
    ChromeHeadless: {
      flags: ['--no-sandbox'],
    },
    ChromeCustom: {
      base: 'ChromeHeadless',
      flags: ['--no-sandbox'],
    },
  },
};

const teamCityConfig = {
  plugins: [require('karma-teamcity-reporter')],
  reporters: ['teamcity'],
};

module.exports = config => {
  const configuration = isCI
    ? _.mergeWith(baseConfig, teamCityConfig, customizer)
    : baseConfig;
  const merged = _.mergeWith(configuration, projectConfig, customizer);

  // This is a hack -- need to replace this with a proper implementation that adds the flags
  // to the given browser
  merged.browsers = ['ChromeCustom'];
  config.set(merged);
};

function customizer(a, b) {
  let result;
  if (_.isArray(a)) {
    result = a.slice();
    result.unshift.apply(result, b);
  }
  return result;
}
