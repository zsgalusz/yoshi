const { Engine } = require('velocity');
const { bundleTargets = [] } = require('yoshi-config');
const { getId } = require('bundle-utils');

const velocityData = require('./velocity.data.json');
const velocityDataPrivate = require('./velocity.private.data.json');

const engine = new Engine({ template: './src/index.vm' });

const latestTarget = bundleTargets.length > 1 && bundleTargets[bundleTargets.length - 1];
const modernBundleHash = latestTarget ? getId(latestTarget) : null;

module.exports = (data) => {
  return engine.render(
    {
      modernBundleHash,
      ...velocityData,
      ...velocityDataPrivate,
      ...data,
    },
  );
}
