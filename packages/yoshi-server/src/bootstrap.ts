import { Router } from 'express';
import bodyParser from 'body-parser';
import server from './server';

export = async (app: Router, context: any) => {
  const handle = await server(context);

  app.use(bodyParser.json());

  app.all('*', handle);

  return app;
};
