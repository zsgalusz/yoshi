const fs = require('fs');
const path = require('path');
const semver = require('semver');

module.exports = async ({ base = process.cwd() } = {}) => {
  const templateNvmrc = require.resolve('./templates/.nvmrc');
  const templateVersion = fs.readFileSync(templateNvmrc, 'utf-8');

  let projectVersion = '0';

  const userNvmrcPath = path.join(base, '.nvmrc');

  try {
    projectVersion = fs.readFileSync(userNvmrcPath, 'utf8');
  } catch (e) {}

  if (
    semver.satisfies(semver.coerce(templateVersion), `>=v${projectVersion}`)
  ) {
    console.log(`Upgrading node version @ ${templateVersion}`);
    fs.writeFileSync(userNvmrcPath, templateVersion);
  }
};
