## Yoshi Server

> Fully-typed zero boilerplate web server

Currently, setting up a simple [Node Platform](https://github.com/wix-platform/wix-node-platform) server requires a lot boilerplate: Setting up an [index.js](https://github.com/wix/yoshi/blob/master/packages/create-yoshi-app/templates/fullstack/javascript/index.js), [index-dev.js](https://github.com/wix/yoshi/blob/master/packages/create-yoshi-app/templates/fullstack/javascript/index-dev.js), [environment.js](https://github.com/wix/yoshi/blob/master/packages/create-yoshi-app/templates/fullstack/javascript/environment.js) and a somewhat complex [src/server.js](https://github.com/wix/yoshi/blob/master/packages/create-yoshi-app/templates/fullstack/javascript/src/server.js). We generate a lot of files that we don't expect developers to change or understand.

With `yoshi-server`, we take a step closer to including a runtime framework along with Yoshi as a build tool.

### Goals

- Reduce the amount of boilerplate required to write a server.
- Abstract the communication between the client and its server.
- Show clear error messages from the server in both, the terminal and the browser.
- Minimize the differences between full-stack and client projects.
- Make it easier for us to make non-breaking changes in the future.
- Support a wide array of use cases: `yoshi-server` shouldn't limit developers from using their custom routing solutions, databases, middleware, etc.

### Proposal

Yoshi will provide its APIs, based on the [Node Platform](https://github.com/wix-platform/wix-node-platform), for creating a server.

#### Server functions

Yoshi will provide an abstraction for defining and consuming server APIs from the client (Inspired by [http-functions](https://github.com/wix-incubator/http-functions) by [shahata](https://github.com/shahata)).

The API and concept are similar to [workerize-loader](https://github.com/developit/workerize-loader):

- Server functions can be defined as named exports from files with an `*.api.js` extension:

```js
export const greeting = function(name) {
  return {
    greet: `hello ${name}!`
  };
};
```

- They can be invoked from the client by creating an API instance, importing a server function, and calling it with arguments. This will trigger an HTTP request to an endpoint on the server that will run the function with the correct arguments and return its response:

```js
import create from "yoshi-server/client";
import { greet } from "./api/greeting";

const api = create({ baseUrl: "http://wix.com" });

api.request(greet, 12).then(data => {
  console.log(data.name);
});
```

- An [Express](http://expressjs.com) request and response objects are available on the server function context (`this`):

```js
export const greeting = function() {
  return this.req.query;
};
```

- Since server functions don't have type completions for `this`, and to prevent mistakes such as returning non-serializable values from them, they can be optionally wrapped with a helper function:

```js
import { wrap } from "yoshi-server";

export const greeting = wrap(function(age: number) {
  // Adds type completions for `this`
  console.log(this.req);

  // Verifies that the returned value is serializable
  return {
    name: `world! ${age}`,
    age
  };
});
```

- Invoking multiple server functions at once can be done with a single call to the server:

```js
import create from "yoshi-server/client";
import { greet, bye } from "./api/greeting";

const api = create({ baseUrl: "http://wix.com" });

api.batch([greet, 12], [bye, 10]).then(([data1, data2]) => {
  console.log(data1, data2);
});
```

- Server functions will support type completions for both, JavaScript and TypeScript projects, from defining server functions to consuming them and using their results. With [Ambassador](https://github.com/wix-private/ambassador), client code can have type completions for RPC/Proto responses.
- For better developer experience, we can show a small indicator on the client if a call to a server function failed, possibly with some verbose error information that can be returned from a failed function. Similar to https://github.com/zeit/next.js/pull/6526.
- Async return values should be supported. Returning a promise from a server function will wait until it's resolved before sending the response back.

#### Route functions

Since server functions are consumed from the client, we'll use route functions to expose routes to the outside world. Route functions are similar to server functions and support expressing routes (along with URL parameters) via the filesystem:

- Files in `src/routes` will be mapped to a route on the server with a URL that matches the filesystem. For example, `src/routes/users/create.js` will translate into `/users/create`.
- Optional named parameters can be used by wrapping the filename or directory name with `[]` and are available to the route function as `this.params`. For example: `src/routes/users/[pid].js` will map into `/users/:pid`.
- Similar to server functions, route files export a single function that returns a response and they can access [Express's](http://expressjs.com) request and response objects from the function context. It's recommended to also wrap them with `wrap` for type completions:

```js
import { wrap } from "yoshi-server";

export default wrap(async function() {
  return {
    name: "world!"
  };
});
```

- Runtime and 404 errors from route functions should show verbose responses in development. Currently, a blank page is shown. We should show verbose and pretty error pages, similar to [youch](https://github.com/poppinss/youch).

### Issues / notes

#### Common use cases

I want to discuss common use cases and how they should be used with `yoshi-server`:

- [wix-bootstrap-ng](https://github.com/wix-platform/wix-node-platform) initializes some APIs and makes them available on the [context](https://github.com/wix-platform/wix-node-platform/tree/master/bootstrap/wix-bootstrap-ng#context). Accessing the context should be available from every server or route function as `this.context`:

```js
import { wrap } from "yoshi-server";

export const greeting = wrap(async function(age: number) {
  const experiments = await this.context.petri
    .client(this.req.aspects)
    .conductAllInScope("foo");

  return {
    experiments
  };
});
```

- Rendering [EJS](https://github.com/mde/ejs) templates should be done by importing and calling `render()`. It accepts a template name and data, looks for it in `src/templates`, and returns the resulting HTML:

```js
import { render } from "yoshi-server";

export default async function() {
  const html = await render("app", {
    title: "hello world"
  });

  return html;
}
```

- Some server code requires users to be logged in. Limiting access to a server or route function only to logged-in users should be done by importing and calling `requireLogin()`. It should return a 403 (forbidden) error if the user isn't logged in:

```js
import { wrap, requireLogin } from "yoshi-server";

export const greet = wrap(async function(age: number) {
  await requireLogin(this.req);

  return {
    name: `world! ${age}`,
    age
  };
});
```

- Most [Node Platform](https://github.com/wix-platform/wix-node-platform) apps use an ERB configuration file to get runtime information from Chef. To avoid having to load the config in many server/route functions, `yoshi-server` will load the app's ERB config file and provide it as `this.config` (Separate config files can still be loaded with `this.context.config.load()`):

```js
import { wrap } from "yoshi-server";

export const greet = wrap(async function(age: number) {
  const { clientTopology } = this.config;

  return {
    name: `world! ${age}`,
    clientTopology
  };
});
```

#### Custom server and routing

Normally, you start your server with `yoshi start`, but you can override it and customize it with your own routes, middleware, [wix-bootstrap-ng](https://github.com/wix-platform/wix-node-platform) plugins, etc.

To use a custom server, start by creating an `index.js` file that starts up [wix-bootstrap-ng](https://github.com/wix-platform/wix-node-platform) and calls `express()` with your custom express function:

```js
import bootstrap from "@wix/wix-bootstrap-ng";

bootstrap()
  // Custom `wix-bootstrap-ng` plugins
  .use(require("@wix/wix-bootstrap-greynode"))
  .use(require("@wix/wix-bootstrap-hadron"))
  // A path to a custom express function
  .express(require.resolve("./your-express-function"))
  .start();
```

Your custom express function can add custom middleware and routing and eventually delegate to `yoshi-server`:

```js
import server from "yoshi-server";

export default async (app, context) => {
  const handle = await server(context);

  // Use custom middleware, routing, db connection
  // or even mount `yoshi-server` on a different path
  app.get("/foo", (req, res) => {
    res.send("bar");
  });

  app.all("*", handle);

  return app;
};
```

#### Server functions' implementation

- Yoshi will use a [Webpack loader](https://webpack.js.org/loaders) to transform `*.api.js` files into files that contain metadata about how to consume those functions. For example, consider the following server function:

```js
export const greet = function() {
  return "hello";
};
```

With the loader, it would be transformed into the following:

```js
export const greet = { fileName: "...", methodName: "..." };
```

- This DSL structure transformation is somewhat similar to the transformation [GraphQL](https://github.com/apollographql/graphql-tag) has.
- Similarily to [graphql-request](https://github.com/prisma/graphql-request) and [apollo-client](https://github.com/apollographql/apollo-client), we can create different and more specialized clients that consume server function metadata and make requests to the server. An added benefit is that we get full type completion for both, the arguments of every function and its return type.
- This RFC suggests creating an instance and passing it around to consume server functions. I think that this is required since most apps need some runtime configuration (baseUrl, headers, timeouts). Using a global approach will create a very misleading API. We can create neat APIs that help pass this instance around, similar to [@apollo/react-hooks](https://www.apollographql.com/docs/react/essentials/get-started/#connect-your-client-to-react).
- Since the loader only exposes metadata to consume server functions, other clients/abstractions can be built on top of it, similar to the different clients that consume [GraphQL](https://graphql.org/learn) queries.

### Final notes

- Now that most server boilerplate is provided as a library/framework it can be tested thoroughly. And because it has a very generic API (server and route functions), we can run a fake implementation of the [Node Platform](https://github.com/wix-platform/wix-node-platform) in local development or testing to speed it up. This _really_ builds on the idea described in [overreacted.io](https://overreacted.io/how-does-the-development-mode-work/).
- Hot reloading server and route functions should work in development without reloading the entire process or requiring wrapping functions with `hot` (Similar to [bootstrap-hot-loader](https://github.com/wix/yoshi/tree/master/packages/bootstrap-hot-loader)).
- Different return values from server and route functions can be supported, similarly to how it's done in [polkadot](https://github.com/lukeed/polkadot).
