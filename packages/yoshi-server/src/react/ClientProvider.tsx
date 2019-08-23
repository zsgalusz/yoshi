import React from 'react';
import HttpClient from '../client';
import { ClientContext } from './ClientContext';

export const ClientProvider: React.FC<{ client: HttpClient }> = ({
  children,
  client,
}) => {
  return (
    <ClientContext.Provider value={{ client }}>
      {children}
    </ClientContext.Provider>
  );
};
