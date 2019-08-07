import { RequiredRecursively } from '../utils';
import { Config } from './config';

const validConfig: RequiredRecursively<Config> = {
  puppeteer: {
    executablePath: '/usr/',
    ignoreDefaultArgs: true,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
    dumpio: false,
    env: {
      NODE_ENV: 'develop',
    },
    pipe: false,
  },
  bootstrap: {
    setup: async () => {},
    teardown: async () => {},
  },
  server: {
    command: 'npm run server',
    port: 3000,
  },
  specOptions: {
    globals: {},
  },
  e2eOptions: {
    globals: {},
  },
  collectCoverage: true,
  collectCoverageFrom: ['__tests__'],
  coverageReporters: ['json'],
  coverageDirectory: 'bla',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: { global: { key: 1 } },
};

export default validConfig;
