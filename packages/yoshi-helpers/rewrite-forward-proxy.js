const { createProxyServer } = require('http-proxy');
const net = require('net');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const enableDestroy = require('server-destroy');

module.exports = async function startRewriteForwardProxy({
  search,
  rewrite,
  port,
}) {
  const regularProxy = createProxyServer({ ignorePath: true, secure: false });

  const options = {
    key: fs.readFileSync(path.join(__dirname, './server.key')),
    cert: fs.readFileSync(path.join(__dirname, './server.cert')),
  };

  // If we get a bad response, status codes 4xx or 5xx, something's wrong with CDN
  // we should inform the user about it.
  regularProxy.on('proxyRes', function(proxyRes, req, res) {
    const fullUrl = `${req.connection.encrypted ? 'https' : 'http'}://${
      req.headers.host
    }${req.url}`;
    if (proxyRes.statusCode >= 400 && fullUrl.indexOf(search) > -1) {
      res.statusCode = proxyRes.statusCode;
      res.headers = proxyRes.headers;
      res.write(
        `Proxy got ${proxyRes.statusCode} status code on ${fullUrl}!\n` +
          `You got the wrong path or something other than Yoshi CDN is running on ${rewrite}?\n` +
          'See the docs: https://wix.github.io/yoshi/docs/api/cli#start',
      );
    }
  });

  function proxyRequest(protocol) {
    return (req, res) => {
      let target =
        protocol + '://' + req.headers.host + url.parse(req.url).path;
      const originalTarget = target;

      if (target.startsWith(search)) {
        target = target.replace(search, rewrite);
      }

      regularProxy.web(req, res, { target }, err => {
        const expectingAnswerFromCDN = originalTarget !== target;

        if (err) {
          res.statusCode = 500;
          if (expectingAnswerFromCDN) {
            res.write(
              `Proxy failed to get ${target}: ${err.message}\n` +
                `You need to start Yoshi CDN to serve ${originalTarget}?\n` +
                'See the docs: https://wix.github.io/yoshi/docs/api/cli#start',
            );
          }
          res.end();
        }
      });
    };
  }

  const httpsReverseProxyServer = https.createServer(
    options,
    proxyRequest('https'),
  );

  enableDestroy(httpsReverseProxyServer);

  // start an https server to proxy requests
  const httpsReverseProxyPort = await new Promise(resolve => {
    const listener = httpsReverseProxyServer.listen(0, () => {
      resolve(listener.address().port);
    });
  });

  const server = http.createServer(proxyRequest('http'));

  enableDestroy(server);

  server.on('connect', (_, socket) => {
    // open a TCP connection to the remote host
    const conn = net.connect(httpsReverseProxyPort, '127.0.0.1', function() {
      // respond to the client that the connection was made
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
      // create a tunnel between the two hosts
      socket.pipe(conn);
      socket.on('error', () => {});
      conn.pipe(socket);
    });

    conn.on('error', () => {});
  });

  server.listen(port);

  return async () => {
    await closePromise(server);
    await closePromise(httpsReverseProxyServer);
  };
};

function closePromise(closable) {
  return new Promise((resolve, reject) => {
    closable.destroy(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
