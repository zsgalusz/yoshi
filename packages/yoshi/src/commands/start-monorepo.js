const startApp = require('./start-app');

const { apps } = require('yoshi-helpers/monorepo');

const [, appName] = process.argv.slice(2);
const app = apps.find(lernaApp => lernaApp.name === appName);

module.exports = async () => {
  return startApp({ app });
};
