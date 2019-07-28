import fs from 'fs-extra';
import puppeteer from 'puppeteer';
import { setupRequireHooks } from 'yoshi-helpers/require-hooks';
import loadJestYoshiConfig from 'yoshi-config/jest';
import { WS_ENDPOINT_PATH } from './constants';

// the user's config is loaded outside of a jest runtime and should be transpiled
// with babel/typescript, this may be run separately for every worker
setupRequireHooks();

const jestYoshiConfig = loadJestYoshiConfig();

const ParentEnvironment = !jestYoshiConfig.bootstrap
  ? require('jest-environment-node')
  : require('../jest-environment-yoshi-bootstrap');

class PuppeteerEnvironment extends ParentEnvironment {
  async setup() {
    await super.setup();

    const browserWSEndpoint = await fs.readFile(WS_ENDPOINT_PATH, 'utf8');

    if (!browserWSEndpoint) {
      throw new Error('wsEndpoint not found');
    }

    this.global.browser = await puppeteer.connect({
      browserWSEndpoint,
    });

    this.global.page = await this.global.browser.newPage();

    this.global.page.setDefaultTimeout(5000);

    this.global.page.setDefaultNavigationTimeout(5000);

    this.global.page.on('pageerror', (error: any) => {
      console.warn(`Puppeteer page error: ${error.message}`);
      console.warn(error.stack);
    });
  }

  async teardown() {
    await this.global.page.close();
    await super.teardown();
  }
}
export = PuppeteerEnvironment;
