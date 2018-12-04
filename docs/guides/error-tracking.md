---
id: error-tracking
title: Error Tracking
sidebar_label: Error Tracking
---

[Sentry](https://sentry.io) is an error tracking platform.

In order to catch errors early on, [there's a command line tool](https://github.com/wix-private/fed-infra/tree/master/add-sentry) that installs it to your project.
To use it, run the following command on your project root:

```sh
npx --package @wix/add-sentry add-sentry -t <SENTRY_TEAM_NAME> -p <YOUR_PROJECT_NAME>
```
