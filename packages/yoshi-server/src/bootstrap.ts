import { Router } from 'express';
import server from './server';

export = async (app: Router, context: any) => {
  const handle = await server(context);

  app.all('*', handle);

  return app;
};
