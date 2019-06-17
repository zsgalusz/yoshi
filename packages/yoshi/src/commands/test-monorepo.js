// Assign env vars before requiring anything so that it is available to all files
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

const path = require('path');
const execa = require('execa');
const minimist = require('minimist');
const { createRunner } = require('haste-core');
const LoggerPlugin = require('../plugins/haste-plugin-yoshi-logger');
const chalk = require('chalk');
// const projectConfig = require('yoshi-config');
const { apps } = require('yoshi-helpers/monorepo');
const {
  watchMode,
  hasE2ETests,
  hasBundleInStaticsDir,
} = require('yoshi-helpers/queries');

const { printAndExitOnErrors } = require('../error-handler');

const runner = createRunner({
  logger: new LoggerPlugin(),
});

const rawCliArgs = process.argv.slice(2);
const cliArgs = minimist(rawCliArgs);

// const debugPort = cliArgs.debug;
// const debugBrkPort = cliArgs['debug-brk'];
const shouldWatch = cliArgs.watch || cliArgs.w || watchMode();

// const configPath = require.resolve('../../config/jest.config.js');

module.exports = runner.command(
  async tasks => {
    const wixCdn = tasks[require.resolve('../tasks/cdn/index')];

    // // Run tests for libs
    // execa.shellSync(
    //   `npx jest --config=${configPath} --rootDir=${process.cwd()} ${libs
    //     .map(lib => lib.location)
    //     .join(' ')}`,
    //   {
    //     stdio: 'inherit',
    //   },
    // );

    // Run app tests
    await apps.reduce(async (acc, app) => {
      await acc;

      if (!shouldWatch && hasE2ETests(app.location)) {
        await bootstrapCdn(app);
      }

      execa.shellSync(`npx jest`, {
        cwd: app.location,
        stdio: 'inherit',
      });
    }, Promise.resolve());

    function bootstrapCdn(app) {
      if (!hasBundleInStaticsDir(app.location)) {
        console.error();
        console.error(
          chalk.red(
            ' ● Warning:\n\n' +
              "   you are running e2e tests and doesn't have any bundle located in the statics directory\n" +
              '   you probably need to run ' +
              chalk.bold('npx yoshi build') +
              ' before running the tests',
          ),
        );
        console.error();
      }
      return printAndExitOnErrors(() =>
        wixCdn(
          {
            port: app.servers.cdn.port,
            ssl: app.servers.cdn.ssl,
            publicPath: app.servers.cdn.url,
            statics: path.join(app.ROOT_DIR, app.clientFilesPath),
          },
          { title: 'cdn' },
        ),
      );
    }
    // const configPath = require.resolve('../../config/jest.config.js');
    // const jestCliOptions = [
    //   require.resolve('jest/bin/jest'),
    //   `--config=${configPath}`,
    //   `--rootDir=${process.cwd()}`,
    // ];
    // shouldWatch && jestCliOptions.push('--watch');
    // const jestForwardedOptions = rawCliArgs
    //   .slice(rawCliArgs.indexOf('test') + 1)
    //   // filter yoshi's option
    //   .filter(arg => arg !== '--jest' && arg.indexOf('debug') === -1);
    // jestCliOptions.push(...jestForwardedOptions);
    // if (debugBrkPort !== undefined) {
    //   jestCliOptions.unshift(`--inspect-brk=${debugBrkPort}`);
    //   !jestForwardedOptions.includes('--runInBand') &&
    //     jestCliOptions.push('--runInBand');
    // } else if (debugPort !== undefined) {
    //   jestCliOptions.unshift(`--inspect=${debugPort}`);
    //   !jestForwardedOptions.includes('--runInBand') &&
    //     jestCliOptions.push('--runInBand');
    // }
    // try {
    //   await execa('node', jestCliOptions, { stdio: 'inherit' });
    // } catch (error) {
    //   console.error(`jest failed with status code "${error.code}"`);
    //   process.exit(1);
    // }
  },
  { persistent: shouldWatch },
);
