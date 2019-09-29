const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const getTemplateNodeVersion = workingDir =>
  fs.readFileSync(path.join(workingDir, '.nvmrc')).toString();

module.exports = workingDir => {
  const currentNode = process.version;
  const templateNode = getTemplateNodeVersion(workingDir);

  console.log(`Node ${currentNode} detected!`);

  if (!semver.satisfies(currentNode, templateNode)) {
    console.log(`Your node version doesn't match ${templateNode}.\n`);
    return false;
  }

  return true;
};
