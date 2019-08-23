import React from 'react';
import HttpClient from '../client';

export const HttpContext: React.Context<{
  client?: HttpClient;
}> = React.createContext({});
