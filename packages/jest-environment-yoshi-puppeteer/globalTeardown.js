const fs = require('fs-extra');
const { WS_ENDPOINT_PATH } = require('./constants');
const cdnProxy = require('./cdnProxy');
const { killSpawnProcessAndHisChildren } = require('yoshi-helpers/utils');

module.exports = async () => {
  await fs.remove(WS_ENDPOINT_PATH);

  await global.BROWSER.close();

  if (global.SERVER) {
    killSpawnProcessAndHisChildren(global.SERVER);
  }

  await cdnProxy.stop();
};
