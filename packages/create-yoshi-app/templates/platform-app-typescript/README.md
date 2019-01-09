# out-of-iframe-app

Out of iframe docs:
http://wixplorer.wixpress.com/out-of-iframe/reference

Configure your widgets as described in the docs above. 

* Widget URL - link to the editor URL (served by your server). This is your widget but in an iframe.
* App Settings URL - link to the settings panel URL (served by your server) 
* Widget Endpoint json should link to your bundle with the component, like this:

```
{
    "componentUrl": "http:\/\/localhost:3200\/viewerExampleWidget.bundle.js"
}
```

In addition to `platform.viewerScriptUrl`, configure `platform.baseUrls.staticsBaseUrl` - should be the statics base URL (to your production one)
 
```
{
     "platform": {
         "baseUrls": {
             "staticsBaseUrl": "http:\/\/localhost:3200\/"
         },
         "viewerScriptUrl": "http:\/\/localhost:3200\/viewerScript.bundle.js"
     }
 }
```
Configure `src/config/index.js` with your widgets ids and experiments scope.

