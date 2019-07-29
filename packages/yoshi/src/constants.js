const localIdentName = {
  short: '[hash:base64:5]',
  long: '[path][name]__[local]__[hash:base64:5]',
};

// const unpkgDomain = 'https://static.parastorage.com/unpkg';

const PORT = parseInt(process.env.PORT, 10) || 3000;

const SENTRY_DSN = 'https://9325f661ff804c4a94c48e8c2eff9149@sentry.io/1292532';

const minimumNodeVersion = '8.7.0';

const isInteractive = process.stdout.isTTY;

module.exports = {
  localIdentName,
  PORT,
  SENTRY_DSN,
  minimumNodeVersion,
  isInteractive,
};