/**
 * local server entry file, for local development
 */
import app from './app';

/**
 * start server with port
 */
const startServer = (port: number | string) => {
  const server = app.listen(port, () => {
    console.log(`Server ready on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && typeof port === 'number') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
  return server;
};

const PORT = process.env.API_PORT || process.env.PORT || 3002;
const server = startServer(typeof PORT === 'string' ? parseInt(PORT) : PORT);

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  if (server && 'close' in server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  if (server && 'close' in server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

export default app;
