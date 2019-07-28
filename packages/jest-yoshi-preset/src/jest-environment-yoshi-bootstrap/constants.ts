import childProcess from 'child_process';
import { processIsJest, getProcessIdOnPort } from 'yoshi-helpers/utils';

if (!process.env.JEST_WORKER_ID) {
  throw new Error(`process.env.JEST_WORKER_ID is not defined`);
}
const JEST_WORKER_ID = parseInt(process.env.JEST_WORKER_ID, 10);

let COUNTER = 1;

export const appConfDir = `./target/configs-${process.env.JEST_WORKER_ID}`;
export const appLogDir = `./target/logs-${process.env.JEST_WORKER_ID}`;
export const appPersistentDir = `./target/persistent-${process.env.JEST_WORKER_ID}`;

export function getPort() {
  const generatedPort = 1000 + (JEST_WORKER_ID + 1) * 300 + COUNTER++;

  try {
    const pid = getProcessIdOnPort(generatedPort);

    if (pid) {
      if (processIsJest(parseInt(pid, 10))) {
        // exit process if it's running by jest
        childProcess.execSync(`kill -9 ${pid}`);
      } else {
        // try to increment port if current process isn't jest
        COUNTER++;
        return module.exports.getPort();
      }
    }
  } catch (err) {
    // we don't care if we "getProcessIdOnPort" fails
  }

  return generatedPort;
}
