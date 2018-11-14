const http = require('http');
const https = require('https');

function redirectMiddleware(hostname, port) {
  return (req, res, next) => {
    if (!/\.min\.(js|css)/.test(req.originalUrl)) {
      return next();
    }

    const httpModule = req.protocol === 'http' ? http : https;

    const options = {
      port,
      hostname,
      path: req.originalUrl.replace('.min', ''),
      rejectUnauthorized: false,
    };

    const request = httpModule.request(options, proxiedResponse => {
      for (const header in proxiedResponse.headers) {
        res.setHeader(header, proxiedResponse.headers[header]);
      }
      proxiedResponse.pipe(res);
    });

    request.on('error', () => next()).end();
  };
}

module.exports = { redirectMiddleware };