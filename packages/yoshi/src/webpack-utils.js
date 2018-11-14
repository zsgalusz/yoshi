const cors = require('cors');
const chalk = require('chalk');
const webpack = require('webpack');
const waitPort = require('wait-port');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const { prepareUrls } = require('react-dev-utils/WebpackDevServerUtils');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const serverHandler = require('serve-handler');
const project = require('yoshi-config');
const path = require('path');
const { PUBLIC_DIR, STATICS_DIR } = require('yoshi-config/paths');
const { PORT } = require('./constants');
const { redirectMiddleware } = require('../src/tasks/cdn/server-api');
const { isPlainObject, isString } = require('lodash');
const { getListOfEntries } = require('yoshi-helpers');

const isInteractive = process.stdout.isTTY;

function createCompiler(config) {
  let compiler;

  try {
    compiler = webpack(config);
  } catch (err) {
    console.log(chalk.red('Failed to compile.'));
    console.log();
    console.log(err.message || err);
    console.log();
    process.exit(1);
  }

  compiler.hooks.invalid.tap('recompile-log', () => {
    if (isInteractive) {
      clearConsole();
    }
    console.log('Compiling...');
  });

  compiler.hooks.done.tap('finished-log', stats => {
    if (isInteractive) {
      clearConsole();
    }

    const messages = formatWebpackMessages(stats.toJson({}, true));
    const isSuccessful = !messages.errors.length && !messages.warnings.length;

    if (isSuccessful) {
      console.log(chalk.green('Compiled successfully!'));

      if (isInteractive) {
        const serverUrls = prepareUrls('http', '0.0.0.0', PORT);
        const devServerUrls = prepareUrls(
          project.servers.cdn.ssl ? 'https' : 'http',
          '0.0.0.0',
          project.servers.cdn.port,
        );

        console.log();
        console.log(
          `Your server is starting and should be accessible from your browser.`,
        );
        console.log();

        console.log(
          `  ${chalk.bold('Local:')}            ${
            serverUrls.localUrlForTerminal
          }`,
        );
        console.log(
          `  ${chalk.bold('On Your Network:')}  ${
            serverUrls.lanUrlForTerminal
          }`,
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
          `  ${chalk.bold('On Your Network:')}  ${
            devServerUrls.lanUrlForTerminal
          }`,
        );

        console.log();
        console.log('Note that the development build is not optimized.');
        console.log(
          `To create a production build, use ` +
            `${chalk.cyan('npm run build')}.`,
        );
        console.log();
      }
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

  return compiler;
}

function resourceTimingMiddleware() {
  return (req, res, next) => {
    res.setHeader('Timing-Allow-Origin', '*');
    next();
  };
}

function createDevServerConfig({
  publicPath = PUBLIC_DIR,
  https,
  contentBase = STATICS_DIR,
  host = '0.0.0.0',
} = {}) {
  return {
    // Enable gzip compression for everything served
    compress: true,
    clientLogLevel: 'error',
    contentBase: false,
    watchContentBase: false,
    hot: true,
    publicPath,
    // We write our own errors/warnings to the console
    quiet: true,
    https,
    // The server should be accessible externally
    host,
    overlay: true,
    before(app) {
      // Send cross origin headers
      app.use(cors());

      app.use(resourceTimingMiddleware());

      // Redirect `.min.(js|css)` to `.(js|css)`
      app.use(redirectMiddleware(host, project.servers.cdn.port));
    },
    after(app) {
      // This should be last middleware, since serve-handler serves 404
      // https://github.com/zeit/serve-handler
      app.use(async (req, res) => {
        await serverHandler(req, res, {
          public: contentBase,
        });
      });
    },
  };
}

function addEntry(config, hotEntries) {
  let newEntry = {};

  if (!Array.isArray(config.entry) && typeof config.entry === 'object') {
    const keys = Object.keys(config.entry);

    for (const entryName of keys) {
      newEntry[entryName] = hotEntries.concat(config.entry[entryName]);
    }
  } else {
    newEntry = hotEntries.concat(config.entry);
  }

  config.entry = newEntry;
}

async function waitForServerToStart({ server }) {
  const portFound = await waitPort({
    port: PORT,
    output: 'silent',
    timeout: 20000,
  });

  if (!portFound) {
    console.log(
      chalk.red(
        `\nCouldn't find a server running on port ${chalk.bold(PORT)}.`,
      ),
    );
    console.log(
      chalk.red(
        `Please make sure "${chalk.bold(
          server,
        )}" sets up a server on this port.\n`,
      ),
    );
    console.log(chalk.red('Aborting'));
    process.exit(1);
  }
}

function waitForCompilation(compiler) {
  return new Promise((resolve, reject) => {
    compiler.hooks.done.tap(
      'promise',
      stats => (stats.hasErrors() ? reject(stats) : resolve(stats)),
    );
  });
}

const normalizeEntries = entries => {
  if (isString(entries)) {
    return [entries];
  } else if (isPlainObject(entries)) {
    return Object.keys(entries).reduce((total, key) => {
      total[key] = normalizeEntries(entries[key]);
      return total;
    }, {});
  }
  return entries;
};

function createWebpackDevServer({
  createClientWebpackConfig,
  hmr,
  transformHMRRuntime,
  host,
  port,
  https,
  publicPath,
  staticsPath,
  configuredEntry,
  defaultEntry,
}) {
  const clientConfig = createClientWebpackConfig({
    isDebug: true,
    isAnalyze: false,
  });

  if (hmr) {
    // Configure client hot module replacement
    addEntry(clientConfig, [
      require.resolve('webpack/hot/dev-server'),
      require.resolve('webpack-dev-server/client'),
    ]);

    clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  if (transformHMRRuntime) {
    const entryFiles = getListOfEntries(configuredEntry || defaultEntry);
    clientConfig.module.rules.forEach(rule => {
      if (Array.isArray(rule.use)) {
        rule.use = rule.use.map(useItem => {
          if (useItem === 'babel-loader') {
            useItem = { loader: 'babel-loader' };
          }
          if (useItem.loader === 'babel-loader') {
            if (!useItem.options) {
              useItem.options = {};
            }
            if (!useItem.options.plugins) {
              useItem.options.plugins = [];
            }
            useItem.options.plugins.push(
              require.resolve('react-hot-loader/babel'),
              [
                path.resolve(
                  __dirname,
                  'plugins/babel-plugin-transform-hmr-runtime',
                ),
                { entryFiles },
              ],
            );
          }
          return useItem;
        });
      }
    });
  }

  clientConfig.entry = normalizeEntries(clientConfig.entry);

  // Setup dev server (CDN)
  const devServerConfig = createDevServerConfig({
    publicPath: publicPath || clientConfig.output.publicPath,
    https: https,
    host,
    ...(staticsPath ? { contentBase: path.resolve(staticsPath) } : {}),
  });

  const clientCompiler = webpack(clientConfig);
  const compilationPromise = waitForCompilation(clientCompiler);

  const devServer = new WebpackDevServer(clientCompiler, devServerConfig);

  compilationPromise.then(stats => {
    const statsString = stats.toString({
      colors: true,
      hash: false,
      chunks: false,
      assets: false,
      children: false,
      version: false,
      timings: false,
      modules: false,
      // Suppresses warnings that arise from typescript transpile-only and rexporting types
      // see https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalse
      warningsFilter: /export .* was not found in/,
    });

    if (stats) {
      console.log(statsString);
    }
  });

  // Start up webpack dev server
  return new Promise((resolve, reject) => {
    devServer.listen(
      port,
      host,
      err =>
        err
          ? reject(err)
          : resolve({
              devServer,
              compilationPromise,
            }),
    );
  });
}

module.exports = {
  createCompiler,
  createWebpackDevServer,
  createDevServerConfig,
  waitForServerToStart,
  waitForCompilation,
  addEntry,
};
