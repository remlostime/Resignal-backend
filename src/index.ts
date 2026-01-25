import createServer from './server';

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

// 仅在直接运行时启动（非 Vercel 环境）
if (require.main === module) {
  start();
}

export default createServer;
