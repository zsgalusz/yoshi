import React from 'react';
import { HttpClient } from '../client/interface';

export const HttpContext: React.Context<{
  client?: HttpClient;
}> = React.createContext({});
