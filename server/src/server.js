const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const { startScheduler } = require('./jobs/slaScheduler');
const logger = require('./utils/logger');

const start = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start SLA & Escalation Scheduler
    startScheduler();

    // 3. Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`ProofFlow API server running in ${config.nodeEnv} mode on port ${config.port}`);
    });

    // Handle termination signals
    const gracefulShutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
