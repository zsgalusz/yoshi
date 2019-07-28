import fs from 'fs-extra';
import { killSpawnProcessAndHisChildren } from 'yoshi-helpers/utils';
import { shouldRunE2Es } from './utils';
import * as cdnProxy from './cdnProxy';
import { WS_ENDPOINT_PATH } from './constants';

export default async () => {
  if (await shouldRunE2Es()) {
    await fs.remove(WS_ENDPOINT_PATH);

    await global.BROWSER.close();

    if (global.SERVER) {
      await killSpawnProcessAndHisChildren(global.SERVER);
    }

    await cdnProxy.stop();
  }
};
