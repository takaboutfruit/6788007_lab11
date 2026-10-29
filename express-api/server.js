const express = require('express');
const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/', (_req, res) => {
  res.json({ message: process.env.APP_MESSAGE || 'Hello from local Express', lab: 111 });
});
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', framework: 'express' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Express listening on port ${port}`);
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
