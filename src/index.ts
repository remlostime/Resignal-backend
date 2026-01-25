import createServer from './server.js';

const start = async () => {
  const server = await createServer(); // 加 await
  
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  start();
}