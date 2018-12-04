---
id: production-app
title: Production Ready Applications
sidebar_label: Production Readiness
---

Wow! You're about to take your application to production. Are you excited?
Before taking the leap and making it big, we need to make sure we're on the same page in terms of monitoring and error tracking.

## Sentry

[Sentry](https://sentry.io) is an error tracking platform.

In order to catch errors early on, [there's a command line tool](https://github.com/wix-private/fed-infra/tree/master/add-sentry) that installs it to your project.
To use it, run the following command on your project root:

```sh
npx --package @wix/add-sentry add-sentry -t <SENTRY_TEAM_NAME> -p <YOUR_PROJECT_NAME>
```

## FedOps

In order to configure your project with FedOps, use [the command line tool](https://github.com/wix-private/fed-infra/tree/master/add-fedops) by running the following command on your project root:

```sh
npx --package @wix/add-fedops add-fedops
```
