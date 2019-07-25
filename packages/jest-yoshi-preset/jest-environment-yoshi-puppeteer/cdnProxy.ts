import startRewriteForwardProxy from 'yoshi-helpers/rewrite-forward-proxy';
import {getProjectCDNBasePath} from 'yoshi-helpers/utils';
import config from 'yoshi-config';

let closeProxy: () => Promise<void>;

export async function start(port: number) {
  closeProxy = await startRewriteForwardProxy({
    search: getProjectCDNBasePath(),
    rewrite: config.servers.cdn.url,
    port,
  });
}

export async function stop() {
  closeProxy && (await closeProxy());
}
