const threadLoader = require('./thread');

const disableTsThreadOptimization =
  process.env.DISABLE_TS_THREAD_OPTIMIZATION === 'true';

module.exports = isAngularProject => ({
  test: /\.tsx?$/,
  exclude: /(node_modules)/,
  use: [
    ...(disableTsThreadOptimization ? [] : [threadLoader()]),
    ...(isAngularProject ? ['ng-annotate-loader'] : []),
    {
      loader: 'ts-loader?{"logLevel":"warn"}',
      options: {
        // Sets *transpileOnly* to true and WARNING! stops registering all errors to webpack.
        // Needed for HappyPack or thread-loader.
        happyPackMode: !disableTsThreadOptimization,
        // compilerOptions: isAngularProject
        //   ? {}
        //   : { module: 'esnext', moduleResolution: 'node' },
      },
    },
  ],
});
