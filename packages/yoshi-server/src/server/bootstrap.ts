import { Router } from 'express';
import bootstrap from '@wix/wix-bootstrap-ng';
import Server from './server';

bootstrap()
  // https://github.com/wix-platform/wix-node-platform/tree/master/greynode/wix-bootstrap-greynode
  .use(require('@wix/wix-bootstrap-greynode'))
  // https://github.com/wix-platform/wix-node-platform/tree/master/bootstrap-plugins/hadron/wix-bootstrap-hadron
  .use(require('@wix/wix-bootstrap-hadron'))
  .express(async (app: Router, context: any) => {
    const server = new Server(context);

    app.all('*', server.handle);

    return app;
  })
  .start();
