// server.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000; // Use PORT environment variable if available

// Use environment variables for database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// Basic route to ensure server is running
app.get('/', (req, res) => {
  res.send('API is running');
});

// Endpoint to fetch winning numbers
app.get('/api/winning-numbers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lotto_max_results ORDER BY draw_date DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
