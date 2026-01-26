import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });  // 明确指定文件

const { app } = await import('./server.js');

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();