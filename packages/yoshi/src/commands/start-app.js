process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const parseArgs = require('minimist');

const cliArgs = parseArgs(process.argv.slice(2));

if (cliArgs.production) {
  process.env.BABEL_ENV = 'production';
  process.env.NODE_ENV = 'production';
}

const fs = require('fs-extra');
const stream = require('stream');
const child_process = require('child_process');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const openBrowser = require('react-dev-utils/openBrowser');
const project = require('yoshi-config');
const { BUILD_DIR, TARGET_DIR } = require('yoshi-config/paths');
const {
  createClientWebpackConfig,
  createServerWebpackConfig,
} = require('../../config/webpack.config');
const {
  createCompiler,
  createDevServerConfig,
  waitForServerToStart,
  waitForCompilation,
  addEntry,
} = require('../webpack-utils');

function serverLogPrefixer() {
  return new stream.Transform({
    transform(chunk, encoding, callback) {
      this.push(`${chalk.greenBright('[SERVER]')}: ${chunk.toString()}`);
      callback();
    },
  });
}

module.exports = async () => {
  await Promise.all([fs.emptyDir(BUILD_DIR), fs.emptyDir(TARGET_DIR)]);

  const clientConfig = createClientWebpackConfig({
    isDebug: true,
    isAnalyze: false,
  });

  const serverConfig = createServerWebpackConfig({
    isDebug: true,
  });

  // Configure client hot module replacement
  addEntry(clientConfig, [
    require.resolve('webpack/hot/dev-server'),
    require.resolve('webpack-dev-server/client'),
  ]);

  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

  // Configure server hot module replacement
  addEntry(serverConfig, [require.resolve('../../config/hot')]);

  serverConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

  // Configure compilation
  const multiCompiler = createCompiler([clientConfig, serverConfig]);
  const compilationPromise = waitForCompilation(multiCompiler);

  const [clientCompiler, serverCompiler] = multiCompiler.compilers;

  // Setup dev server (CDN)
  const devServerConfig = createDevServerConfig({
    publicPath: clientConfig.output.publicPath,
  });

  const devServer = new WebpackDevServer(clientCompiler, devServerConfig);

  // Start up server compilation
  let serverProcess;

  serverCompiler.watch({ 'info-verbosity': 'none' }, (error, stats) => {
    if (serverProcess && !error && !stats.hasErrors()) {
      serverProcess.send({});
    }
  });

  // Start up webpack dev server
  await new Promise((resolve, reject) => {
    devServer.listen(
      project.servers.cdn.port,
      '0.0.0.0',
      err => (err ? reject(err) : resolve()),
    );
  });

  // Wait for both compilations to finish
  try {
    await compilationPromise;
  } catch (error) {
    process.exit(1);
  }

  // Start up the user's server
  const startServerProcess = () => {
    serverProcess = child_process.fork('index.js', {
      stdio: 'pipe',
    });

    serverProcess.stdout.pipe(serverLogPrefixer()).pipe(process.stdout);
    serverProcess.stderr.pipe(serverLogPrefixer()).pipe(process.stderr);

    serverProcess.on('message', () => {
      serverProcess.kill();
      startServerProcess();
    });
  };

  startServerProcess();

  await waitForServerToStart({ port: 3000 });

  // Once it started, open up the browser
  openBrowser('http://localhost:3000');

  return {
    persistent: true,
  };
};
