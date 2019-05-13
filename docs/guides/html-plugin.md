
---
id: html-plugin
title: HTML Plugin
sidebar_label: HTML Plugin
---

This feature introduces [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin). It will help remove redundant boilerplate from projects and allow us to support features like `initial` split chunks, better static asset caching, automatic externals and more.

#### Better Static asset caching

Static assets will no longer depend on artifact version. They will have a new hash, as part of the file's name, which will be based on the asset's content. This means that if in a specific GA a static file was not changed, it will remain with the same name, and will still be cached for the user. 
For example:

`https://static.parastorage.com/services/wix-api-explorer/1.60.0/app.bundle.min.js` 

will now become:

`https://static.parastorage.com/services/wix-api-explorer/dist/app.d666fc07.bundle.min.js`


### Migration for Fullstack apps (bootstrap)


### Migration for Client apps

