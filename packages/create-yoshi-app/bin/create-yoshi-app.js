#! /usr/bin/env node

process.on('unhandledRejection', error => {
  throw error;
});

const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const wrap = require('word-wrap');
const createApp = require('../src/createApp');
const TemplateModel = require('../src/TemplateModel');
const verifyDirectoryName = require('../src/verifyDirectoryName');
const verifyWorkingDirectory = require('../src/verifyWorkingDirectory');
const verifyRegistry = require('../src/verifyRegistry');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .option(
    '--answers-file [filepath]',
    'A path to a javascript file that returns an answers object',
  )
  .arguments('[project-directory]')
  .usage(chalk.cyan('[project-directory]'))
  .parse(process.argv);

let workingDir = process.cwd();
const customProjectDir = program.args[0];
const answersFile = program.answersFile;

verifyDirectoryName(customProjectDir || workingDir);

if (customProjectDir) {
  fs.ensureDirSync(customProjectDir);
  workingDir = path.resolve(customProjectDir);
  process.chdir(workingDir);
}

verifyWorkingDirectory(workingDir);
verifyRegistry(workingDir);

const templateModel = answersFile
  ? TemplateModel.fromFilePath(answersFile)
  : null;

createApp({
  workingDir,
  templateModel,
}).then(({ templateModel: results, hasNode }) => {
  if (!hasNode) {
    console.log(
      boxen(
        wrap(
          `Detected node version doesn't match .nvmrc so we skipped ${chalk.cyan(
            'npm install',
          )}ing. ` +
            `Please install and use the correct node version and then run ${chalk.cyan(
              'npm install',
            )}.`,
          { width: 60 },
        ),
        { padding: 1, borderColor: 'red', borderStyle: 'round' },
      ),
    );
  }

  console.log(
    `\nSuccess! 🙌  Created ${chalk.magenta(
      results.projectName,
    )} at ${chalk.green(workingDir)}`,
  );

  if (hasNode) {
    console.log('You can run the following commands:\n');
    console.log(chalk.cyan('  npm start'));
    console.log('    Start your app in development mode\n');
    console.log(chalk.cyan('  npm test'));
    console.log('    Run the test runner\n');
    console.log(chalk.cyan('  npx yoshi lint'));
    console.log('    Run the linter\n');
    console.log(chalk.cyan('  npx yoshi build'));
    console.log('    Build your app for production\n');
  }

  console.log(
    `We advise you'll start by running the following command${
      customProjectDir || !hasNode ? 's' : ''
    }:\n`,
  );

  if (customProjectDir) {
    console.log(chalk.cyan(`cd ${customProjectDir}`));
  }

  if (!hasNode) {
    console.log(`${chalk.cyan(`nvm install`)} / ${chalk.cyan(`fnm install`)}`);
    console.log(`${chalk.cyan(`nvm use`)} / ${chalk.cyan(`fnm use`)}`);
    console.log(chalk.cyan('npm install'));
  }

  console.log(chalk.cyan('npm start\n'));

  console.log('For more information visit https://github.com/wix/yoshi');
  console.log('Good luck! 🍀');
});
