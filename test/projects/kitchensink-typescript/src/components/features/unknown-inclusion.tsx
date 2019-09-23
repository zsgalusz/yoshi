import React from 'react';
import image from './assets/file.unknown';

export default () => (
  <picture id="unknown-inclusion">
    <source srcSet={image} type="image/webp" />
  </picture>
);
