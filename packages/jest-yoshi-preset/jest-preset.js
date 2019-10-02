const fs = require('fs');
const pick = require('lodash/pick');
const chalk = require('chalk');
const globby = require('globby');
const { envs, supportedEnvs, withLatestJSDom } = require('./constants');
const { setupRequireHooks } = require('yoshi-helpers/require-hooks');
const globs = require('yoshi-config/globs');
const loadJestYoshiConfig = require('yoshi-config/jest');

// the user's config is loaded outside of a jest runtime and should be transpiled
// with babel/typescript, this may be run separately for every worker
setupRequireHooks();

const modulePathIgnorePatterns = ['<rootDir>/dist/', '<rootDir>/target/'];

if (envs && envs.some(env => !supportedEnvs.includes(env))) {
  console.log();
  console.log(chalk.red(`jest-yoshi-preset: invalid MATCH_ENV=${envs}`));
  console.log(chalk.red(`supported envs: ${supportedEnvs.join(`, `)}`));
  console.log();
  process.exit(1);
}

const jestYoshiConfig = loadJestYoshiConfig();

const projectOverrideMapping = {
  e2e: 'e2eOptions',
  spec: 'specOptions',
};
const supportedProjectOverrideKeys = ['globals', 'testURL', 'moduleNameMapper'];
const supportedGlobalOverrideKeys = [
  'collectCoverage',
  'collectCoverageFrom',
  'coverageReporters',
  'coverageDirectory',
  'coveragePathIgnorePatterns',
  'coverageThreshold',
];

const globalValidOverrides = pick(jestYoshiConfig, supportedGlobalOverrideKeys);

const config = {
  globalSetup: require.resolve(
    './jest-environment-yoshi-puppeteer/globalSetup',
  ),
  globalTeardown: require.resolve(
    './jest-environment-yoshi-puppeteer/globalTeardown',
  ),
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
  ...globalValidOverrides,
  projects: [
    ...[
      {
        displayName: 'spec',
        testEnvironment: withLatestJSDom
          ? require.resolve('jest-environment-jsdom-fourteen')
          : 'jsdom',
        testURL: 'http://localhost',
        testMatch: globs.unitTests.map(glob => `<rootDir>/${glob}`),
        setupFiles: [require.resolve('regenerator-runtime/runtime')],
      },
      {
        displayName: 'e2e',
        testEnvironment: require.resolve('./jest-environment-yoshi-puppeteer'),
        testMatch: globs.e2eTests.map(glob => `<rootDir>/${glob}`),
        setupFiles: [
          require.resolve(
            './jest-environment-yoshi-bootstrap/environment-setup.js',
          ),
          require.resolve('regenerator-runtime/runtime'),
        ],
      },
    ]
      .filter(({ displayName }) => {
        if (envs) {
          return envs.includes(displayName);
        }

        return true;
      })
      .map(project => {
        const projectOverrideKey = projectOverrideMapping[project.displayName];
        const projectOverrides = jestYoshiConfig[projectOverrideKey];

        const projectValidOverrides = projectOverrides
          ? pick(projectOverrides, supportedProjectOverrideKeys)
          : {};

        // We recommend projects use the `__tests__` directory But we support `test`
        // too
        const setupFilePaths = globby.sync(
          `(__tests__|test)/${project.displayName}-setup.(ts|js){,x}`,
        );

        const [setupTestsPath] = setupFilePaths;

        // There should only be 1 test file, throw an error if more than exists
        if (setupFilePaths.length > 1) {
          console.log();
          console.log(chalk.red('Multiple setup files were detected:'));
          console.log();
          setupFilePaths.forEach(setupFilePath => {
            console.log(chalk.red(` > ${setupFilePath}`));
          });
          console.log();
          console.log(
            chalk.red(
              `We recommend removing one of them. Currently using ${chalk.bold(
                setupTestsPath,
              )}.`,
            ),
          );
          console.log();
        }

        const setupTestsFile =
          setupTestsPath && fs.existsSync(setupTestsPath)
            ? `<rootDir>/${setupTestsPath}`
            : undefined;

        const setupFilesAfterEnv = [
          // Use longer default test timeout for e2e tests
          project.displayName === 'e2e' && require.resolve('./setup/e2e'),
          // Load project's setup file if it exists
          setupTestsFile,
        ].filter(Boolean);

        const staticAssetsExtensions = [
          'png',
          'jpg',
          'jpeg',
          'gif',
          'svg',
          'woff',
          'woff2',
          'ttf',
          'otf',
          'eot',
          'wav',
          'mp3',
          'mp4',
          'html',
          'md',
        ];

        const reStaticAssets = staticAssetsExtensions.join('|');

        return {
          ...project,
          modulePathIgnorePatterns,

          transformIgnorePatterns: [
            // 🚨🚨🚨 DANGER 🚨🚨🚨
            // This regex is matching against modules
            // which    *ARE*    inside node_modules
            // and
            // which  *ARE NOT*  of the mentioned extensions.
            //
            // This is essentially whitelisting static asset extension
            // imports within node_modules, if they're of a supported extension.
            `/node_modules/(?!(.*?\\.(st\\.css|${reStaticAssets})$))`,

            // Locally `babel-preset-yoshi` is symlinked, which causes jest to try and run babel on it.
            // See here for more details: https://github.com/facebook/jest/blob/6af2f677e5c48f71f526d4be82d29079c1cdb658/packages/jest-core/src/runGlobalHook.js#L61
            '/babel-preset-yoshi/',
          ],

          transform: {
            '^.+\\.jsx?$': require.resolve('./transforms/babel'),
            '^.+\\.tsx?$': require.resolve('./transforms/typescript'),
            '\\.st.css?$': require.resolve('@stylable/jest'),
            '\\.(gql|graphql)$': require.resolve('jest-transform-graphql'),
            [`\\.(${reStaticAssets})$`]: require.resolve('./transforms/file'),
          },

          moduleNameMapper: {
            '^(?!.+\\.st\\.css$)^.+\\.(?:sass|s?css|less)$': require.resolve(
              'identity-obj-proxy',
            ),
          },

          setupFilesAfterEnv,
          ...projectValidOverrides,
        };
      }),
    // workaround for https://github.com/facebook/jest/issues/5866
    {
      displayName: 'dummy',
      testMatch: ['dummy'],
      modulePathIgnorePatterns,
    },
  ],
};

module.exports = config;
