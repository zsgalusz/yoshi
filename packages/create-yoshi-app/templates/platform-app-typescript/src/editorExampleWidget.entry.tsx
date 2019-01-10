import React from 'react';
import ReactDOM from 'react-dom';
import { ExampleWidgetRoot } from './components/ExampleWidgetRoot/ExampleWidgetRoot';
import { ViewerScriptWrapper, withStyles } from '@wix/native-components-infra';
import { viewerScript } from './platform/viewerScript';
//TODO: check (window as any)
const WrappedExampleWidget = ViewerScriptWrapper(
  withStyles(ExampleWidgetRoot, { cssPath: ['editorExampleWidget.stylable.bundle.css'] }),
  {
    viewerScript,
    Wix: (window as any).Wix,
    widgetConfig: {
      widgetId: ''
    },
    overrides: {
      platform: {
        baseUrls: {
          staticsBaseUrl: (window as any).__STATICS_BASE_URL__,
        },
      },
    },
  },
);

ReactDOM.render(<WrappedExampleWidget />, document.getElementById('root'));
