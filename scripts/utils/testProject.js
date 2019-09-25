const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const chalk = require('chalk');
const chokidar = require('chokidar');
const Scripts = require('../../test/scripts');
const { ciEnv, localEnv } = require('./constants');

const testProductionBuildScript = `npx jest --config='jest.production.config.js' --no-cache --runInBand`;
const testLocalDevelopmentScript = `npx jest --config='jest.development.config.js' --no-cache --runInBand`;
const runAdditionalTestsScript = `npx jest --config='jest.plain.config.js' --no-cache --runInBand`;

module.exports = async ({
  templateDirectory,
  testDirectory,
  rootDirectory,
  watchMode = false,
}) => {
  console.log();
  console.log(
    chalk.blue.bold(
      `> Testing ${chalk.underline(path.basename(templateDirectory))}`,
    ),
  );
  console.log();

  const scripts = new Scripts({ testDirectory });

  const options = {
    stdio: 'inherit',
    env: {
      ...process.env,
      TEST_DIRECTORY: testDirectory,
      PORT: scripts.serverProcessPort,
    },
    cwd: templateDirectory,
  };

  const failures = [];

  async function testProductionBuild(pattern) {
    // Test production build (CI env)
    try {
      console.log(chalk.blue(`> Building project for production`));
      console.log();

      await scripts.build(ciEnv);

      console.log();
      console.log(
        chalk.blue(`> Running app's own tests against production build`),
      );
      console.log();

      await scripts.test(ciEnv, pattern);

      console.log();
      console.log(chalk.blue(`> Running production integration tests`));
      console.log();

      const serveResult = await scripts.serve();

      try {
        await execa.shell(
          pattern
            ? `${testProductionBuildScript} ${pattern} --passWithNoTests`
            : testProductionBuildScript,
          options,
        );
      } finally {
        await serveResult.done();
      }
    } catch (error) {
      failures.push(error);
    }
  }

  async function testLocalDevelopment(pattern) {
    // Test local build (local env)
    try {
      console.log();
      console.log(chalk.blue(`> Starting project for development`));
      console.log();

      const startResult = await scripts.start(localEnv);

      try {
        console.log();
        console.log(
          chalk.blue(`> Running app's own tests against development build`),
        );
        console.log();

        await scripts.test(localEnv, pattern);

        console.log();
        console.log(chalk.blue(`> Running development integration tests`));
        console.log();

        await execa.shell(
          pattern
            ? `${testLocalDevelopmentScript} ${pattern} --passWithNoTests`
            : testLocalDevelopmentScript,
          options,
        );
      } finally {
        await startResult.done();
      }
    } catch (error) {
      failures.push(error);
    }
  }

  async function runAdditionalTests(pattern) {
    // Run additional tests (errors, analyze)
    if (
      await fs.pathExists(
        path.resolve(templateDirectory, 'jest.plain.config.js'),
      )
    ) {
      try {
        console.log();
        console.log(chalk.blue(`> Running additional integration tests`));
        console.log();

        await execa.shell(
          pattern
            ? `${runAdditionalTestsScript} ${pattern} --passWithNoTests`
            : runAdditionalTestsScript,
          options,
        );
      } catch (error) {
        failures.push(error);
      }
    }
  }

  async function runTests(pattern) {
    await testProductionBuild(pattern);
    await testLocalDevelopment(pattern);
    await runAdditionalTests(pattern);
  }

  await runTests(typeof watchMode === 'string' ? [watchMode] : undefined);

  if (watchMode) {
    // watch over tests and re run them
    chokidar
      .watch(`**/*${watchMode}*`, {
        persistent: true,
        ignoreInitial: true,
        cwd: templateDirectory,
      })
      .on('all', (event, filePath) => runTests(filePath));
  } else {
    // Clean eventually
    await fs.remove(rootDirectory);
  }

  // Fail testing this project if any errors happened
  if (failures.length > 0) {
    throw new Error(failures.map(error => error.stack).join('\n\n'));
  }
};
