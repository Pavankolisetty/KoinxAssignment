### KoinX Crypto API Project
This project implements a cryptocurrency stats API with a background worker, as part of an assignment. It includes two servers: api-server for handling API requests and storing data, and worker-server for running a background job to fetch crypto stats periodically.
Project Structure

api-server/: Contains the Express API server with endpoints for fetching and calculating crypto stats.
worker-server/: Contains the background worker that publishes events every 15 minutes via NATS.

### Setup Instructions

Prerequisites:

Node.js (v16 or higher)
MongoDB (local installation)
NATS server (local installation)


### Install Dependencies:

For api-server:cd api-server
npm install


For worker-server:cd worker-server
npm install




Set Up Environment Variables:

In api-server, create a .env file with:MONGODB_URI=mongodb://localhost:27017/crypto_stats
PORT=3000
COINGECKO_API_KEY=<your-coingecko-api-key>




### Run the Servers:

Start MongoDB locally.
Start the NATS server: nats-server.
Start the api-server:cd api-server
npm start


Start the worker-server:cd worker-server
npm start





### API Endpoints

GET /stats?coin=<coin>: Returns the latest price, market cap, and 24h change for the specified coin (bitcoin, ethereum, matic-network).
GET /deviation?coin=<coin>: Returns the standard deviation of the price for the last 100 records of the specified coin.

Background Job

The worker-server runs a job every 15 minutes, publishing an event to NATS.
The api-server subscribes to these events and fetches/stores crypto stats.

Notes

Ensure MongoDB and NATS are running before starting the servers.
The project uses a local MongoDB instance. For production, consider using MongoDB Atlas.

