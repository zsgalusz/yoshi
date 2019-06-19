process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2), {
  alias: {
    server: 'entry-point',
    https: 'ssl',
  },
  default: {
    server: 'index.js',
    https: false,
  },
});

if (cliArgs.production) {
  process.env.BABEL_ENV = 'production';
  process.env.NODE_ENV = 'production';
}

const { apps } = require('yoshi-config/monorepo');
const startSingleApp = require('./utils/start-single-app');

const [, appName] = process.argv.slice(2);
const app = apps.find(lernaApp => lernaApp.name === appName);

module.exports = async () => {
  await startSingleApp(app, cliArgs);

  return {
    persistent: true,
  };
};
