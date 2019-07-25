process.on('exit', () => {
  if (global.SERVER) {
    global.SERVER.kill();
  }
});

import stream from 'stream';
import child_process from 'child_process';
import fs from 'fs-extra';
import chalk from 'chalk';
import puppeteer from 'puppeteer';
import waitPort from 'wait-port';
import config from 'yoshi-config';
import {shouldDeployToCDN} from 'yoshi-helpers/queries';
import {getProcessOnPort} from 'yoshi-helpers/utils';
import {setupRequireHooks} from 'yoshi-helpers/require-hooks';
import loadJestYoshiConfig from 'yoshi-config/jest';
import {WS_ENDPOINT_PATH} from './constants';
import * as cdnProxy from './cdnProxy';
import {shouldRunE2Es} from './utils';

// the user's config is loaded outside of a jest runtime and should be transpiled
// with babel/typescript, this may be run separately for every worker
setupRequireHooks();

const serverLogPrefixer = () => {
  return new stream.Transform({
    transform(chunk, encoding, callback) {
      this.push(`${chalk.magentaBright('[SERVER]')}: ${chunk.toString()}`);
      callback();
    },
  });
};

export default async () => {
  const jestYoshiConfig = loadJestYoshiConfig();

  // a bit hacky, run puppeteer setup only if it's required
  if (await shouldRunE2Es()) {
    // start with a few new lines
    console.log('\n\n');

    const forwardProxyPort = process.env.FORWARD_PROXY_PORT || '3333';

    if (shouldDeployToCDN()) {
      await cdnProxy.start(parseInt(forwardProxyPort, 10));
    }

    global.BROWSER = await puppeteer.launch({
      // user defined options
      ...jestYoshiConfig.puppeteer,

      // defaults
      args: [
        '--no-sandbox',
        ...(config.servers.cdn.ssl ? ['--ignore-certificate-errors'] : []),
        ...(shouldDeployToCDN()
          ? [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--ignore-certificate-errors',
              `--proxy-server=127.0.0.1:${forwardProxyPort}`,
              '--disable-extensions',
              '--disable-plugins',
            ]
          : []),
        ...(jestYoshiConfig.puppeteer
          ? jestYoshiConfig.puppeteer.args || []
          : []),
      ],
    });

    await fs.outputFile(WS_ENDPOINT_PATH, global.BROWSER.wsEndpoint());

    const webpackDevServerProcess = await getProcessOnPort(
      config.servers.cdn.port,
      false,
    );

    if (!webpackDevServerProcess) {
      throw new Error(
        `Running E2E tests requires a server to serve static files. Could not find any dev server on port ${chalk.cyan(
          config.servers.cdn.port.toString(),
        )}. Please run 'npm start' from a different terminal window.`,
      );
    }

    if (webpackDevServerProcess.cwd !== process.cwd()) {
      throw new Error(
        `A different process (${chalk.cyan(
          webpackDevServerProcess.cwd,
        )}) is already running on port '${chalk.cyan(
          config.servers.cdn.port.toString(),
        )}', aborting.`,
      );
    }

    if (jestYoshiConfig.server) {
      const serverProcess = await getProcessOnPort(
        jestYoshiConfig.server.port,
        false,
      );

      if (serverProcess) {
        throw new Error(
          `A different process (${chalk.cyan(
            serverProcess.cwd,
          )}) is already running on port ${chalk.cyan(
            jestYoshiConfig.server.port.toString(),
          )}, aborting.`,
        );
      }

      global.SERVER = child_process.spawn(jestYoshiConfig.server.command, [], {
        shell: true,
        stdio: 'pipe',
        env: {
          ...process.env,
          PORT: String(jestYoshiConfig.server.port),
        },
      });

      global.SERVER.stdout.pipe(serverLogPrefixer()).pipe(process.stdout);
      global.SERVER.stderr.pipe(serverLogPrefixer()).pipe(process.stderr);

      if (jestYoshiConfig.server.port) {
        const timeout = 5000;

        const portFound = await waitPort({
          port: jestYoshiConfig.server.port,
          output: 'silent',
          timeout,
        });

        if (!portFound) {
          throw new Error(
            `Tried running '${chalk.cyan(
              jestYoshiConfig.server.command,
            )}' but couldn't find a server on port '${chalk.cyan(
              jestYoshiConfig.server.port.toString(),
            )}' after ${chalk.cyan(timeout.toString())} milliseconds.`,
          );
        }
      }

      console.log('\n');
    }
  }
};
