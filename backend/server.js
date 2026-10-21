require('dotenv').config();

const app = require('./app');
const config = require('./config');
const { prisma, disconnectPrisma } = require('./config/prisma');

const startServer = async () => {
  try {
    // Verifier la connexion a PostgreSQL avant d'ouvrir le serveur
    await prisma.$connect();
    console.log('PostgreSQL connecté');

    const server = app.listen(config.port, () => {
      console.log(`
========================================
  Ibag Couture API Server
========================================
  Environment: ${config.nodeEnv}
  Port: ${config.port}
  URL: http://localhost:${config.port}
  Health: http://localhost:${config.port}/health
  API: http://localhost:${config.port}/api
========================================
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed');
        await disconnectPrisma();
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
