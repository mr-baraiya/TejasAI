import app from './app.js';

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  TejasAI Backend Server running!        `);
  console.log(`  Port: http://localhost:${PORT}         `);
  console.log(`  Model: ${process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'}`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`   Another instance of TejasAI or another app is running on port ${PORT}.`);
    console.error(`   To resolve, close the other process or run: npx kill-port ${PORT}\n`);
    process.exit(1);
  } else {
    console.error('Server startup error:', err);
  }
});
