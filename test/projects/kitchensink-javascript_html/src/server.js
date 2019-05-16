import ejs from 'ejs';
import express from 'express';

const app = express();

app.get('/other', async (req, res) => {
  res.send(
    await ejs.renderFile('./src/other-root.ejs', {
      debug: process.env.NODE_ENV === 'production' ? false : true,
    }),
  );
});

app.get('*', async (req, res) => {
  res.send(
    await ejs.renderFile('./src/app-root.ejs', {
      title: 'Some title',
      debug: process.env.NODE_ENV === 'production' ? false : true,
    }),
  );
});

app.listen(process.env.PORT);
