const path = require('path');
const fs = require('fs-extra');
const tempy = require('tempy');
const execa = require('execa');
const { authenticateToRegistry } = require('./publishMonorepo');
const symlinkModules = require('./symlinkModules');
const chokidar = require('chokidar');

const isCI = !!process.env.TEAMCITY_VERSION;

module.exports = async (templateDirectory, watchMode = false) => {
  const rootDirectory = tempy.directory();

  const testDirectory = path.join(rootDirectory, 'project');

  await fs.copy(templateDirectory, testDirectory);

  const copyFile = relativePath => {
    return fs.copy(
      path.join(templateDirectory, relativePath),
      path.join(testDirectory, relativePath),
    );
  };

  const removeFile = relativePath => {
    return fs.remove(path.join(testDirectory, relativePath));
  };

  // Symlink modules locally for faster feedback
  if (!isCI) {
    symlinkModules(testDirectory);

    if (watchMode) {
      const watcher = chokidar.watch(templateDirectory, {
        persistent: true,
        ignoreInitial: true,
        cwd: templateDirectory,
      });

      watcher.on('change', copyFile);
      watcher.on('add', copyFile);
      watcher.on('unlink', removeFile);
    }
  } else {
    // Authenticate and install from our fake registry on CI
    authenticateToRegistry(testDirectory);

    await execa.shell('npm install', {
      cwd: testDirectory,
      stdio: 'inherit',
      extendEnv: false,
      env: {
        PATH: process.env.PATH,
      },
    });
  }

  // Copy mocked `node_modules`
  if (await fs.pathExists(path.join(templateDirectory, '__node_modules__'))) {
    await fs.copy(
      path.join(templateDirectory, '__node_modules__'),
      path.join(testDirectory, 'node_modules'),
    );
  }

  return {
    testDirectory,
    rootDirectory,
  };
};
