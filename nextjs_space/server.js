process.env.NODE_ENV = 'production';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

// In cPanel Passenger, process.env.PORT can be a numeric port or a Unix socket path.
const rawPort = process.env.PORT || '3000';
const isNumeric = /^\d+$/.test(rawPort);
const port = isNumeric ? parseInt(rawPort, 10) : rawPort;

console.log(`Starting server: NODE_ENV=${process.env.NODE_ENV}, PORT=${rawPort}, isNumeric=${isNumeric}`);

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    server.once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`> Hello Bazaar server ready on port/socket: ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start Next.js application:', err);
    process.exit(1);
  });
