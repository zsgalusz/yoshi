/* eslint-env jasmine */

const { TeamCityReporter } = require('jasmine-reporters');
const isCI = require('is-ci');

if (isCI) {
  jasmine.getEnv().clearReporters();
  jasmine.getEnv().addReporter(new TeamCityReporter());
}
