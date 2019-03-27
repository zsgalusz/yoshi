const DEFAULT_CONFIG = {
  specs: {
    node: false,
    browser: false,
  },
  hooks: {},
  hmr: true,
  liveReload: true,
  exports: false,
  clientProjectName: false,
  servers: {
    cdn: {
      port: 3200,
      ssl: false,
    },
  },
  entry: false,
  splitChunks: false,
  defaultEntry: './client',
  separateCss: true,
  cssModules: true,
  tpaStyle: false,
  enhancedTpaStyle: false,
  features: {},
  externals: [],
  transpileTests: true,
  jestConfig: {},
  petriSpecsConfig: {},
  performanceBudget: false,
  resolveAlias: {},
  keepFunctionNames: false,
  umdNamedDefine: true,
  projectType: null,
  externalUnprocessedModules: [],
};

module.exports = DEFAULT_CONFIG;
