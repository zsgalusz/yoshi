import {
  BootstrapSetupOptions,
  BootstrapTeardownOptions,
} from 'yoshi-config/build/jest/config';
import { Browser } from 'puppeteer';

declare global {
  namespace NodeJS {
    interface Global {
      BROWSER: Browser;
      SERVER: any;
      __setup__:
        | undefined
        | ((setupObject: BootstrapSetupOptions) => Promise<void>);
      __teardown__:
        | undefined
        | ((teardownObject: BootstrapTeardownOptions) => Promise<void>);
    }
  }
}

export {};
