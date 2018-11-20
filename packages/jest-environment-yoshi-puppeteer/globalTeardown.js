const fs = require('fs-extra');
const { WS_ENDPOINT_PATH } = require('./constants');
const { shouldRunE2Es } = require('./utils');
const cdnProxy = require('./cdnProxy');

module.exports = async () => {
  console.log('jest teardown');
  if (await shouldRunE2Es()) {
    await fs.remove(WS_ENDPOINT_PATH);

    console.log('closing brwoser');
    await global.BROWSER.close();

    if (global.SERVER) {
      console.log('kiling server');
      global.SERVER.kill();
    }
    console.log('server killed');

    console.log('stopping proxy');
    await cdnProxy.stop();
    console.log('jest teardown - ended');
  }
};
