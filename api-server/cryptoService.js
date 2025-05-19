const axios = require('axios');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB client
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function storeCryptoStats() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db('crypto_stats');
    const collection = db.collection('crypto_stats');

    // Fetch data from CoinGecko API
    const coins = ['bitcoin', 'ethereum', 'matic-network'];
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: coins.join(','),
      },
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
      },
    });

    // Prepare data for MongoDB
    const stats = response.data.map(coin => ({
      coin: coin.id, // Fixed: Use coin.id instead of 'coin.id'
      price: coin.current_price,
      marketCap: coin.market_cap,
      change24h: coin.price_change_percentage_24h,
      timestamp: new Date(),
    }));

    // Store in MongoDB
    await collection.insertMany(stats);
    console.log('Crypto stats stored:', stats);

    // Close connection
    await client.close();
  } catch (error) {
    console.error('Error in storeCryptoStats:', error.message);
  }
}

module.exports = { storeCryptoStats };