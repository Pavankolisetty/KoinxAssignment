const express = require('express');
const { MongoClient } = require('mongodb');
const { connect, StringCodec } = require('nats');
const dotenv = require('dotenv');
const { storeCryptoStats } = require('./cryptoService');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('crypto_stats');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Connect to NATS and subscribe to events
async function setupNats() {
  try {
    const nc = await connect({ servers: 'nats://localhost:4222' });
    console.log('API server connected to NATS');

    const sc = StringCodec();
    const sub = nc.subscribe('crypto.update');
    for await (const msg of sub) {
      const data = JSON.parse(sc.decode(msg.data));
      console.log('Received NATS message:', data);
      if (data.trigger === 'update') {
        await storeCryptoStats();
      }
    }
  } catch (error) {
    console.error('NATS connection error:', error.message);
  }
}

// Middleware to parse JSON requests
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Crypto API Server is running!');
});

// Test route for storeCryptoStats
app.get('/test-store', async (req, res) => {
  await storeCryptoStats();
  res.send('Crypto stats stored!');
});

// Task 2: /stats API
app.get('/stats', async (req, res) => {
  try {
    const coin = req.query.coin;
    const validCoins = ['bitcoin', 'ethereum', 'matic-network'];

    // Validate coin parameter
    if (!coin || !validCoins.includes(coin)) {
      return res.status(400).json({ error: 'Invalid or missing coin parameter. Must be one of: bitcoin, ethereum, matic-network' });
    }

    // Query MongoDB for the latest record of the coin
    const collection = db.collection('crypto_stats');
    const latestStat = await collection
      .find({ coin })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    // Check if data exists
    if (!latestStat.length) {
      return res.status(404).json({ error: `No stats found for ${coin}` });
    }

    // Format response
    const stat = latestStat[0];
    res.json({
      price: stat.price,
      marketCap: stat.marketCap,
      '24hChange': stat.change24h,
    });
  } catch (error) {
    console.error('Error in /stats:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Task 3: /deviation API
app.get('/deviation', async (req, res) => {
  try {
    const coin = req.query.coin;
    const validCoins = ['bitcoin', 'ethereum', 'matic-network'];

    // Validate coin parameter
    if (!coin || !validCoins.includes(coin)) {
      return res.status(400).json({ error: 'Invalid or missing coin parameter. Must be one of: bitcoin, ethereum, matic-network' });
    }

    // Query MongoDB for the last 100 records of the coin
    const collection = db.collection('crypto_stats');
    const records = await collection
      .find({ coin })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    // Check if data exists
    if (!records.length) {
      return res.status(404).json({ error: `No stats found for ${coin}` });
    }

    // Extract prices
    const prices = records.map(record => record.price);

    // Calculate standard deviation
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const deviation = Math.sqrt(variance);

    // Format response
    res.json({
      deviation: parseFloat(deviation.toFixed(2)),
    });
  } catch (error) {
    console.error('Error in /deviation:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
async function startServer() {
  await connectToMongo();
  await setupNats();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
