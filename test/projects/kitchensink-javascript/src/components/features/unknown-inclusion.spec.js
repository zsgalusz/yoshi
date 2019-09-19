import React from 'react';
import ReactDOM from 'react-dom';
import UnknownInclusion from './unknown-inclusion';

it('should pass', () => {
  const div = document.createElement('div');
  ReactDOM.render(<UnknownInclusion />, div);
});
