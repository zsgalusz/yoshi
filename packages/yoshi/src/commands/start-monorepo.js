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

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const execa = require('execa');
const webpack = require('webpack');
const globby = require('globby');
const openBrowser = require('react-dev-utils/openBrowser');
const MultiCompiler = require('webpack/lib/MultiCompiler');
const chokidar = require('chokidar');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const project = require('yoshi-config');
const { chunk } = require('lodash');
const { prepareUrls } = require('react-dev-utils/WebpackDevServerUtils');
const { getPaths } = require('yoshi-config/paths');
const { PORT } = require('../constants');
const {
  createClientWebpackConfig,
  createServerWebpackConfig,
} = require('../../config/webpack.config');
const {
  createCompiler,
  createDevServer,
  waitForCompilation,
} = require('../webpack-utils');
const Server = require('../server-process');

const host = '0.0.0.0';

const https = cliArgs.https || project.servers.cdn.ssl;

const isInteractive = process.stdout.isTTY;

function watchPublicFolder({ paths }) {
  const watcher = chokidar.watch(paths.PUBLIC_DIR, {
    persistent: true,
    ignoreInitial: false,
    cwd: paths.PUBLIC_DIR,
  });

  const copyFile = relativePath => {
    return fs.copy(
      path.join(paths.PUBLIC_DIR, relativePath),
      path.join(paths.ASSETS_DIR, relativePath),
    );
  };

  const removeFile = relativePath => {
    return fs.remove(path.join(paths.ASSETS_DIR, relativePath));
  };

  watcher.on('change', copyFile);
  watcher.on('add', copyFile);
  watcher.on('unlink', removeFile);
}

const { splitPackagesPromise } = require('./utils');

module.exports = async () => {
  const [apps, libs] = await splitPackagesPromise;

  apps.forEach(app => {
    app.paths = getPaths(app.location);
  });

  libs.forEach(lib => {
    lib.paths = getPaths(lib.location);
  });

  // Clean tmp folders
  await Promise.all([
    ...apps.map(({ paths }) => {
      return Promise.all([
        fs.emptyDir(paths.BUILD_DIR),
        fs.emptyDir(paths.TARGET_DIR),
      ]);
    }),

    ...libs.map(({ paths }) => {
      return Promise.all([fs.emptyDir(paths.BUILD_DIR)]);
    }),
  ]);

  // Copy public to statics dir
  Promise.all([
    ...apps.map(async ({ paths }) => {
      if (await fs.pathExists(paths.PUBLIC_DIR)) {
        // all files in `PUBLIC_DIR` are copied initially as Chokidar's `ignoreInitial`
        // option is set to false
        watchPublicFolder({ paths });
      }
    }),

    ...libs.map(async ({ paths, location }) => {
      const watcher = chokidar.watch('src/**/*', {
        cwd: paths.ROOT_DIR,
        ignored: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.json'],
      });

      const copyAsset = async assetPath => {
        const targetFilePath = path.join(location, 'dist', assetPath);

        await fs.ensureFile(targetFilePath);
        await fs.copyFile(path.join(location, assetPath), targetFilePath);
      };

      watcher
        .on('add', copyAsset)
        .on('rename', copyAsset)
        .on('change', copyAsset);

      watcher.on('unlink', async assetPath => {
        await fs.remove(path.join(location, 'dist', assetPath));
      });
    }),
  ]);

  const tsc = execa.shell(
    `npx tsc -b -w --preserveWatchOutput ${libs
      .map(lib => lib.location)
      .join(' ')}`,
    {
      stdio: 'pipe',
    },
  );

  await new Promise(resolve => {
    tsc.stdout.on('data', buffer => {
      const text = buffer.toString();

      if (text.includes('Found 0 errors. Watching for file changes.')) {
        resolve();
      }
    });
  });

  const appsConfigs = apps.map(({ paths, name }) => {
    const clientConfig = createClientWebpackConfig({
      isDebug: true,
      isAnalyze: false,
      isHmr: project.hmr,
      paths,
    });

    const serverConfig = createServerWebpackConfig({
      isDebug: true,
      isHmr: true,
      paths,
    });

    clientConfig.output.publicPath += `${name}/`;

    return [clientConfig, serverConfig];
  });

  const clientConfigs = appsConfigs.map(([c]) => c);
  const serverConfigs = appsConfigs.map(([, c]) => c);

  const clientCompiler = webpack(clientConfigs);
  const serverCompiler = webpack(serverConfigs);

  // Configure compilation
  // const multiCompiler = createCompiler(appsConfigs, { https });
  const clientCompilationPromise = waitForCompilation(clientCompiler);
  const serverCompilationPromise = waitForCompilation(serverCompiler);

  clientCompiler.hooks.done.tap('finished-log', stats => {
    if (isInteractive) {
      // clearConsole();
    }

    const messages = formatWebpackMessages(stats.toJson({}, true));
    const isSuccessful = !messages.errors.length && !messages.warnings.length;

    if (isSuccessful) {
    }

    // If errors exist, only show errors.
    if (messages.errors.length) {
      if (messages.errors.length > 1) {
        messages.errors.length = 1;
      }

      console.log(chalk.red('Failed to compile.\n'));
      console.log(messages.errors.join('\n\n'));

      return;
    }

    // Show warnings if no errors were found.
    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.\n'));
      console.log(messages.warnings.join('\n\n'));
    }
  });

  serverCompiler.hooks.done.tap('finished-log', stats => {
    if (isInteractive) {
      // clearConsole();
    }

    const messages = formatWebpackMessages(stats.toJson({}, true));
    const isSuccessful = !messages.errors.length && !messages.warnings.length;

    if (isSuccessful) {
    }

    // If errors exist, only show errors.
    if (messages.errors.length) {
      if (messages.errors.length > 1) {
        messages.errors.length = 1;
      }

      console.log(chalk.red('Failed to compile.\n'));
      console.log(messages.errors.join('\n\n'));

      return;
    }

    // Show warnings if no errors were found.
    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.\n'));
      console.log(messages.warnings.join('\n\n'));
    }
  });

  // const appsCompilers = chunk(appsConfigs, 2);

  // const [clientCompiler, serverCompiler] = multiCompiler.compilers;

  // Start up server process
  const serverProcess = new Server({ serverFilePath: cliArgs.server });

  // Start up webpack dev server
  // const clientCompiler = new MultiCompiler(appsConfigs.map(([c]) => c));
  // const serverCompiler = new MultiCompiler(appsConfigs.map(([, c]) => c));

  const devServer = await createDevServer(clientCompiler, {
    // publicPath: clientConfig.output.publicPath,
    port: project.servers.cdn.port,
    https,
    host,
  });

  serverCompiler.watch({ 'info-verbosity': 'none' }, async (error, stats) => {
    // We save the result of this build to webpack-dev-server's internal state so the last
    // server build results are sent to the browser on every refresh
    //
    // https://github.com/webpack/webpack-dev-server/blob/master/lib/Server.js#L144
    devServer._stats = stats;

    await new Promise(resolve => setTimeout(resolve, 5000));

    const jsonStats = stats.toJson();

    // If the spawned server process has died, restart it
    if (serverProcess.child && !error && !stats.hasErrors()) {
      await serverProcess.restart();

      // Send the browser an instruction to refresh
      await devServer.send('hash', jsonStats.hash);
      await devServer.send('ok');
    }
    // If it's alive, send it a message to trigger HMR
    else {
      // If there are no errors and the server can be refreshed
      // then send it a signal and wait for a responsne
      if (serverProcess.child && !stats.hasErrors()) {
        const { success } = await serverProcess.send({});

        // HMR wasn't successful, restart the server process
        if (!success) {
          await serverProcess.restart();
        }

        // Send the browser an instruction to refresh
        await devServer.send('hash', jsonStats.hash);
        await devServer.send('ok');
      } else {
        // If there are errors, show them on the browser
        if (jsonStats.errors.length > 0) {
          await devServer.send('errors', jsonStats.errors);
        } else if (jsonStats.warnings.length > 0) {
          await devServer.send('warnings', jsonStats.warnings);
        }
      }
    }
  });

  console.log(chalk.cyan('Starting development environment...\n'));

  // Start up webpack dev server
  await new Promise((resolve, reject) => {
    devServer.listen(project.servers.cdn.port, host, err =>
      err ? reject(err) : resolve(devServer),
    );
  });

  // Wait for both compilations to finish
  try {
    await clientCompilationPromise;
    await serverCompilationPromise;
  } catch (error) {
    // We already log compilation errors in a compiler hook
    // If there's an error, just exit(1)
    process.exit(1);
  }

  console.log(chalk.green('Compiled successfully!'));

  if (isInteractive) {
    const serverUrls = prepareUrls('http', '0.0.0.0', PORT);
    const devServerUrls = prepareUrls(
      https ? 'https' : 'http',
      '0.0.0.0',
      project.servers.cdn.port,
    );

    console.log();
    console.log(
      `Your server is starting and should be accessible from your browser.`,
    );
    console.log();

    console.log(
      `  ${chalk.bold('Local:')}            ${serverUrls.localUrlForTerminal}`,
    );
    console.log(
      `  ${chalk.bold('On Your Network:')}  ${serverUrls.lanUrlForTerminal}`,
    );

    console.log();
    console.log(
      `Your bundles and other static assets are served from your ${chalk.bold(
        'dev-server',
      )}.`,
    );
    console.log();

    console.log(
      `  ${chalk.bold('Local:')}            ${
        devServerUrls.localUrlForTerminal
      }`,
    );
    console.log(
      `  ${chalk.bold('On Your Network:')}  ${devServerUrls.lanUrlForTerminal}`,
    );

    console.log();
    console.log('Note that the development build is not optimized.');
    console.log(
      `To create a production build, use ` + `${chalk.cyan('npm run build')}.`,
    );
    console.log();
  }

  ['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      serverProcess.end();
      devServer.close();
      process.exit();
    });
  });

  try {
    await serverProcess.initialize();
  } catch (error) {
    console.log();
    console.log(
      chalk.red(`Couldn't find a server running on port ${chalk.bold(PORT)}`),
    );
    console.log(
      chalk.red(
        `Please check that ${chalk.bold(
          cliArgs.server,
        )} starts up correctly and that it listens on the expected port`,
      ),
    );
    console.log();
    console.log(chalk.red('Aborting'));
    process.exit(1);
  }

  // Once it started, open up the browser
  openBrowser(cliArgs.url || `${https ? 'https' : 'http'}://localhost:${PORT}`);

  return {
    persistent: true,
  };
};
