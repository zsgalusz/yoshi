const path = require('path');

// A list of paths to template directories
module.exports = [
  '../templates/fullstack',
  '../templates/client',
  '../templates/business-manager-module',
  '../templates/server',
  '../templates-extended/out-of-iframe',
].map(relativePath => path.join(__dirname, relativePath));
