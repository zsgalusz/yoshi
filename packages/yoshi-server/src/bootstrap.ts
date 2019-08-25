import { Router } from 'express';
import Server from './server';

export = async (app: Router, context: any) => {
  const server = new Server(context);

  app.all('*', server.handle);

  return app;
};
