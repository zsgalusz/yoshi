import React from 'react';
import HttpClient from '../client';

export const ClientContext: React.Context<{
  client?: HttpClient;
}> = React.createContext({});
