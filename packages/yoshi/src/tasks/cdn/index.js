const fs = require('fs');
const path = require('path');
const https = require('https');
//const express = require('express');
//const webpack = require('webpack');
//const webpackDevMiddleware = require('webpack-dev-middleware');
const WebpackDevServer = require('webpack-dev-server');
const hotClient = require('webpack-hot-client');
const { decorate } = require('./server-api');
const { shouldRunWebpack, logStats, normalizeEntries } = require('./utils');
const { getListOfEntries, getProcessOnPort } = require('yoshi-helpers');
const { createWebpackDevServer } = require('../../webpack-utils');

module.exports = async ({
  port = '3000',
  ssl,
  hmr = true,
  liveReload = true,
  transformHMRRuntime,
  host = 'localhost',
  publicPath,
  statics,
  webpackConfigPath,
  configuredEntry,
  defaultEntry,
} = {}) => {
  const processOnPort = await getProcessOnPort(parseInt(port));

  if (processOnPort) {
    const currentCwd = process.cwd();

    if (currentCwd !== processOnPort.cwd) {
      throw new Error(
        `Unable to run cdn! port ${port} is already in use by another process in another project (pid=${
          processOnPort.pid
        }, path=${processOnPort.cwd})`,
      );
    } else {
      console.log(`\tcdn is already running on ${port}, skipping...`);

      return;
    }
  }

  console.log(`\tRunning cdn on port ${port}...`);

  const getConfig = require(webpackConfigPath);
  return createWebpackDevServer({
    createClientWebpackConfig: getConfig,
    hmr: hmr || liveReload,
    host,
    port,
    https: ssl
      ? sslCredentials('./assets/key.pem', './assets/cert.pem', '1234')
      : false,
    publicPath,
    staticsPath: statics,
  });
};

function sslCredentials(keyPath, certificatePath, passphrase) {
  const privateKey = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
  const certificate = fs.readFileSync(
    path.resolve(__dirname, certificatePath),
    'utf8',
  );

  return {
    key: privateKey,
    cert: certificate,
    passphrase,
  };
}
