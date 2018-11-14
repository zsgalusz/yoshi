module.exports = () => ({
  test: /\.(js|ts)?$/,
  use: [{ loader: 'source-map-loader' }],
});
