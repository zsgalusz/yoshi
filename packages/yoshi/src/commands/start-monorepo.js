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

const loadPackages = require('yoshi-config/load-packages');
const startSingleApp = require('./utils/start-single-app');

const [, appName] = process.argv.slice(2);

module.exports = async () => {
  const { apps } = await loadPackages();

  const app = apps.find(lernaApp => lernaApp.name === appName);

  await startSingleApp(app, cliArgs);

  return {
    persistent: true,
  };
};
