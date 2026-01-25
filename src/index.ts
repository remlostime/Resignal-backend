import createServer from './server.js';

const start = async () => {
  const server = createServer();
  
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// 简单判断：如果没有被 import，而是直接运行
if (process.argv[1]?.includes('index.ts')) {
  start();
}

export default createServer;
