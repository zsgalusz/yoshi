---
id: running-tests
title: Runing tests
sidebar_label: Running tests
---

# Mocha tests setup:

You can add a `test/mocha-setup.js` file, with mocha tests specific setup. Mocha will `require` this file, if exists.
Example for such `test/mocha-setup.js`:

```js
import "babel-polyfill";
import "isomorphic-fetch";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import chai from "chai";

chai.use(sinonChai);
chai.use(chaiAsPromised);
```

# Karma tests setup:

When running tests using Karma, make sure you have the right configurations in your `package.json` as described in [`yoshi.specs`](#wixspecs) section. In addition, if you have a `karma.conf.js` file, the configurations will be merged with our [built-in configurations](yoshi/config/karma.conf.js).

# Jasmine tests setup:

Specifying a custom glob for test files is possible by configuring `package.json` as described in [`yoshi.specs`](#wixspecs). The default glob matches `.spec.` files in all folders.
<br />
If you wish to load helpers, import them all in a file placed at `'test/setup.js'`.

# Jest test setup:

You may specify a jest config object in your `package.json`, for example:

```json
"jest": {
    "testRegex": "/src/.*\\.spec\\.(ts|tsx)$"
}
```

Every other argument you'll pass to `yoshi test --jest` will be forwarded to jest, For example:

`yoshi test --jest --forceExit foo.spec.js`

Will run jest on `foo.spec.js` file and will apply [`forceExit`](https://jestjs.io/docs/en/cli#forceexit).

# Jest

## Introduction

Yoshi defines a custom [Jest preset](https://jestjs.io/docs/en/configuration#preset-string) to enable zero-configuration testing for most apps.

This preset configures Jest with 3 different project types ([learn more](https://jestjs.io/docs/en/configuration#projects-array-string-projectconfig)), each project uses a unique environment ([learn more](https://jestjs.io/docs/en/configuration#testenvironment-string)). Each environment sets up its own globals and is configured to run for every file that matches a certain glob pattern ([learn more](https://github.com/isaacs/node-glob)).

## Installation

```bash
npm install --save-dev jest-yoshi-preset puppeteer
```

Add the following to your Jest config:

```json
{
  "preset": "jest-yoshi-preset"
}
```

> If you're using TypeScript you should add `jest-yoshi-preset` types to your code by adding the following to your `tsconfig.json`:

```json
{
  "files": ["./node_modules/jest-yoshi-preset/types.d.ts"]
}
```

## Usage

### Dev mode

Use the `start` command to build and serve your bundle and static files, your `e2e` tests require them.

```sh
yoshi start --no-test
```

From a different terminal window, use `npx jest` command normally.

Run a specific test

```shell
npx jest my-specific-test
```

Run all tests of a spcific type (different [jest project](https://jestjs.io/docs/en/configuration#projects-array-string-projectconfig)).

You can filter the tests using the display name (`e2e`, `component`, `server`) and choose more than one, separated by commas.

For example, running only server and component tests:

```shell
MATCH_ENV=server,component npx jest
```

Run jest using watch mode

```shell
npx jest --watch
```

### CI mode

> You can also use this mode locally

In this mode, your tests will run against you local `dist/statics` directory.

```shell
npx yoshi test --jest
```

Yoshi serves the files from `dist/statics`. Make sure to run `npx yoshi build` before you run the tests using this mode.

## Environments

### JSDOM (component)

Sets up a standard [JSDOM](https://github.com/jsdom/jsdom) environment for component tests.

It's configured for every file under `<rootDir>/src/**/*.spec.js`.

### Bootstrap (server)

An environment for testing your server (API) code. It starts up a different instance of your server ([wix-ng-bootstarp based](https://github.com/wix-platform/wix-node-platform)) for every test file.

You sohuld define setup and teardown functions to start/stop your server and relevant mocks (learn more: [wix-bootstrap-testkit](https://github.com/wix-platform/wix-node-platform/tree/master/bootstrap/wix-bootstrap-testkit), [wix-rpc-testkit](https://github.com/wix-platform/wix-node-platform/tree/master/rpc/wix-rpc-testkit)).

Runs for every test file matching `<rootDir>/test/server/**/*.spec.js`.

### Puppeteer (e2e)

An environment that pre-configures [Puppeteer](https://github.com/GoogleChrome/puppeteer) for running your E2E tests.

It creates a global Browser instance ([learn more](https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-browser)) and a global Page instance ([learn more](https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-page)) for every test file. They're available as `global.browser` and `global.page` respectively.

Runs for every file that matches `<rootDir>/test/e2e/**/*.spec.js`.

## Configuration

This preset looks for a `jest-yoshi.config.js` file at the root of your project. The exported object is used to configure different parts of the preset.

example configurations:

- [fullstack project](https://github.com/wix/yoshi/blob/master/packages/create-yoshi-app/templates/fullstack/jest-yoshi.config.js)
- [client project](https://github.com/wix/yoshi/blob/master/packages/create-yoshi-app/templates/client/jest-yoshi.config.js)

```js
module.exports = {
  bootstrap: {
    // environment setup function which called before each test file
    setup: async ({ globalObject }) => {},
    // environment teardown function which called after each test file
    teardown: async ({ globalObject }) => {}
  },
  server: {
    // runs a command which bootstrap the server
    command: "node server.js",
    // wait for a server to start listening on this port before running the tests
    // this port will be available in you server script as an environment variable (PORT)
    port: 3000
  },
  puppeteer: {
    // toggle headless chrome mode
    headless: true
  }
};
```

### Setup Files

If you want to run some code before your tests you can use one of the 3 following setup files (1 for each environment):

- `<rootDir>/test/setup.component.(j|t)s`: JSDOM (component)
- `<rootDir>/test/setup.server.(j|t)s`: Bootstrap (server)
- `<rootDir>/test/setup.e2e.(j|t)s`: Puppeteer (e2e)

These setup files are actually [Jests's `setupTestFrameworkScriptFile`](https://jestjs.io/docs/en/configuration#setuptestframeworkscriptfile-string)

> A path to a module that runs some code to configure or set up the testing framework before each test.

## Enzyme

## Introduction

As you might be aware, our stack runs unit tests using mocha directly on Node.js. Those tests do not run in the browser, which makes the setup much simpler (no bundling, no karma) and most importantly it makes it much faster. The down side of this of course is that any browser API is not available in Node.js environment. [Enzyme](https://github.com/airbnb/enzyme), which is a very commnly used testing utility for React, is using `document`, `window` and DOM API, which is obviously a problem if we run tests in Node.js and not in the browser, but luckily we can use a library called [jsdom](https://github.com/tmpvar/jsdom), which implements the whole DOM API in Node.js.

This guide explains how to add jsdom to an existing project in order to enable testing using mocha and enzyme on Node.js without a browser. Projects generated by the wix-js-stack generator already includes jsdom, so this guide should be used by people who are adding jsdom to an old project that was generated before jsdom support was baked in and obviously also for people who would like to understand how this works.

## Setup

If you try to use enzyme in a tests without setting up jsdom properly you will probably see this error:

```
Cannot render markup in a worker thread. Make sure `window` and `document` are available globally before requiring React when unit testing or use ReactDOMServer.renderToString() for server rendering.
```

Since enzyme doesn't only need DOM API jsdom provides (it actually needs also the `document` and `window` global variables) we use a library called [jsdom-global](https://github.com/rstacruz/jsdom-global) which uses jsdom in order to setup the global variables as enzyme requires. So actually in order to setup jsdom for enzyme all you have to do is install `jsdom-global` as dev dependency:

```sh
$ npm install --save-dev jsdom-global
```

And then import it in your test file:

```js
import "jsdom-global/register";
```

Notice that you must do the **import BEFORE you import enzyme**, otherwise you will still see the error above.

## Cleanup

As hopefully you already noticed yourself, `jsdom-global` is manipulating the global namespace, which might cause many kinds of problems of state leaking between tests and it has to be cleand up after every test. In addition, it creates `window` and `document` global variables, which might be confusing for some third party tools since those variables generally indicate that you are running in a browser.

In order to make sure that the `window` and `document` global variables only exist in tests that use enzyme and in order to make sure we do not leak state between tests it is very important that you group enzyme tests into separate `describe` clauses and in those `describe` clauses add the following code:

```js
let cleanup;
beforeEach(() => (cleanup = require("jsdom-global")()));
afterEach(() => cleanup());
```
