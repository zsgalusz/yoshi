const fs = require('fs');
const { warnOnConfigValidationErrors } = require('../config/project');

const presetPath = require.resolve('../src/index.js');

module.exports = insight => async command => {
  warnOnConfigValidationErrors();
  const appDirectory = fs.realpathSync(process.cwd());
  const action = require(`./commands/${command}`);

  try {
    const { persistent = false } = await action({
      context: presetPath,
      workerOptions: { cwd: appDirectory },
    });

    if (!persistent) {
      process.exit(0);
    }
  } catch (error) {
    insight.trackEvent({
      category: 'error',
      action: command,
      label: error.stack || error,
    });

    // tell insight to send the request to the worker immediately (used with setImmediate)
    insight._send();

    if (error.name !== 'WorkerError') {
      console.error(error);
    }

    process.exit(1);
  }
};
