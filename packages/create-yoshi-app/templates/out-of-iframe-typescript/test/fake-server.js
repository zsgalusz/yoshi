const express = require('express');
const renderVM = require('./vm');
const velocityData = require('../velocity.data.json');
const velocityDataPrivate = require('../velocity.private.data.json');

const app = express();

app.get(
  '/_api/wix-laboratory-server/laboratory/conductAllInScope',
  (req, res) => {
    const experiments = {
      ...velocityData.experiments,
      ...velocityDataPrivate.experiments,
    };
    res.json(experiments);
  },
);

app.use('/editorExampleWidget', (req, res) => {
  res.send(renderVM('./src/editorExampleWidget.entry.vm'));
});

app.use('/settingsExampleWidget', (req, res) => {
  res.send(renderVM('./src/settingsExampleWidget.entry.vm'));
});

// Launch the server
const server = app.listen(process.env.PORT, err => {
  if (!err) {
    console.info(`Fake server is running on port ${server.address().port}`);
  } else {
    console.error(`Fake server failed to start on port ${process.env.PORT}`);
  }
});
