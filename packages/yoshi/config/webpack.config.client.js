const {
  createClientWebpackConfig,
  wrapConfigForMultiBundles,
} = require('./webpack.config');

module.exports = wrapConfigForMultiBundles(createClientWebpackConfig);
