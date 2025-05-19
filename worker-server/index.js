const { connect } = require('nats');
const cron = require('node-cron');

async function startWorker() {
  try {
    // Connect to NATS
    const nc = await connect({ servers: 'nats://localhost:4222' });
    console.log('Worker connected to NATS');

    // Schedule a job to run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('Publishing update event at', new Date().toISOString());
      // Publish a message to the 'crypto.update' subject
      nc.publish('crypto.update', JSON.stringify({ trigger: 'update' }));
    });

    console.log('Worker server running. Publishing updates every 15 minutes.');
  } catch (error) {
    console.error('Worker server error:', error.message);
  }
}

startWorker();